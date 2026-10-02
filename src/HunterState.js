import { asList } from '@/Hunter';
import { basicMoves } from '@/Playbooks';
import {
    TEXTBOX, PLACEABLE, isContainer, lookup, optionsOf, pathOf, refPath, resolve,
} from '@/PlaybookData';

// Everything about a hunter that's computed from its choices rather than stored
// (see plan/Schema Notes.md: "Getting started", "Choosing", "Placement").

const RATINGS = ['charm', 'cool', 'sharp', 'tough', 'weird'];
const VERBS = ['pick', 'cross', 'remove'];

const verbOf = (rule) => VERBS.find((verb) => rule[verb] !== undefined) ?? 'pick';

// The number a rule asks for, whatever its verb.
const countOf = (rule) => rule[verbOf(rule)];

const IMPROVEMENT_LISTS = ['improvements', 'improvements_advanced', 'improvements_mythic'];

const findImprovement = (playbook, id) => {
    for (const list of IMPROVEMENT_LISTS) {
        const found = playbook[list]?.options.find((option) => option.id === id);
        if (found) {
            return { improvement: found, list: playbook[list] };
        }
    }
    return null;
};

// Where a source's choices are stored on the hunter.
//   { kind: 'getting_started', rule: i }
//   { kind: 'improvement', index: k, rule: i }
//   { kind: 'nested', path, rule: i }
const choicesFor = (h, key) => {
    if (key.kind === 'getting_started') {
        return h.getting_started[key.rule];
    }
    if (key.kind === 'improvement') {
        return h.improvements[key.index]?.choices[key.rule];
    }
    return h.nested[key.path]?.[key.rule];
};

// Same, creating the list if needed (call when changing choices, not while rendering).
const ensureChoices = (h, key) => {
    if (key.kind === 'getting_started') {
        h.getting_started[key.rule] ??= [];
    } else if (key.kind === 'improvement') {
        h.improvements[key.index].choices[key.rule] ??= [];
    } else {
        h.nested[key.path] ??= [];
        h.nested[key.path][key.rule] ??= [];
    }
    return choicesFor(h, key);
};

const sameKey = (a, b) => a.kind === b.kind && a.rule === b.rule && a.index === b.index
    && a.path === b.path;

// Replay every source of choices, in order: getting_started, each improvement in the
// order taken, then the choices that belong to items the hunter has gained.
const hunterState = (h) => {
    const root = h.playbook;
    const picks = []; // { path, node, text, container, source, key }
    const crosses = []; // { path, container, source }
    const gained = new Map(); // path -> { node, source }
    const effects = []; // { effect, source }

    const gain = (node, source) => {
        const path = pathOf(node, root);
        if (path && !gained.has(path)) {
            gained.set(path, { node, source });
        }
    };

    const process = ({ holder, self, keyBase, source }) => {
        for (const ref of asList(holder.grant)) {
            const node = resolve(ref, root, self);
            if (PLACEABLE.has(node?.type)) {
                gain(node, source);
            } else if (isContainer(node)) {
                // granting a list grants everything in it (e.g. @basic_moves)
                for (const entry of optionsOf(ref, root, self)) {
                    if (PLACEABLE.has(entry.node?.type)) {
                        gain(entry.node, source);
                    }
                }
            }
        }
        asList(holder.choose).forEach((rule, i) => {
            const key = { ...keyBase, rule: i };
            const verb = verbOf(rule);
            const container = rule.from.startsWith('@*.')
                ? rule.from
                : refPath(rule.from, root, self);
            for (const choice of choicesFor(h, key) ?? []) {
                if (choice?.id === TEXTBOX) {
                    picks.push({ text: choice.text, container, source, key });
                    continue;
                }
                const node = lookup(choice, root);
                if (verb === 'cross') {
                    crosses.push({ path: choice, container, source, key });
                } else if (verb === 'remove') {
                    const at = picks.findIndex((p) => p.path === choice);
                    if (at >= 0) {
                        picks.splice(at, 1);
                    }
                    gained.delete(choice);
                } else if (node) {
                    picks.push({ path: choice, node, container, source, key });
                    if (PLACEABLE.has(node.type)) {
                        gain(node, source);
                    }
                    for (const effect of node.effects ?? []) {
                        effects.push({ effect, source, key });
                    }
                }
            }
        });
        for (const effect of holder.effects ?? []) {
            effects.push({ effect, source, keyBase });
        }
    };

    process({
        holder: root.getting_started ?? {},
        self: root.getting_started,
        keyBase: { kind: 'getting_started' },
        source: 'getting_started',
    });
    h.improvements.forEach((taken, index) => {
        const found = findImprovement(root, taken.id);
        if (found) {
            process({
                holder: found.improvement,
                self: found.improvement,
                keyBase: { kind: 'improvement', index },
                source: taken.id,
            });
        }
    });
    // Choices belonging to a gained item (Practitioner, Tools and Techniques, ...).
    // Gaining more items while doing this adds them to the end of the queue.
    const done = new Set();
    for (let more = true; more;) {
        more = false;
        for (const [path, { node }] of [...gained]) {
            if (!done.has(path) && node.choose) {
                done.add(path);
                more = true;
                process({
                    holder: { choose: node.choose },
                    self: node,
                    keyBase: { kind: 'nested', path },
                    source: path,
                });
            }
        }
    }

    const all = [...gained.entries()].map(([path, { node, source }]) => ({ path, node, source }));
    const ofType = (type) => all.filter((item) => item.node.type === type);

    // Your own playbook's features are always on your sheet; others' only when gained.
    const ownFeatures = ['pre_moves', 'post_moves'].flatMap((area) => (root[area] ?? [])
        .map((node) => ({ path: pathOf(node, root), node, area, source: 'playbook' })));
    const foreignFeatures = ofType('feature')
        .filter((item) => !ownFeatures.some((own) => own.path === item.path))
        .map((item) => ({ ...item, area: areaOf(item.path) }));

    const ratings = Object.fromEntries(RATINGS.map((r) => [r, h.ratings_base?.[r] ?? 0]));
    for (const { effect } of effects) {
        if (effect.rating && effect.add) {
            ratings[effect.rating] += effect.add;
        }
    }

    const advanced = new Set();
    for (const { effect, source } of effects) {
        if (effect.advance_basic) {
            picks.filter((p) => p.source === source && p.node?.type === 'basic_move')
                .forEach((p) => advanced.add(p.path));
        }
    }

    return {
        picks,
        crosses,
        effects,
        ratings,
        advanced,
        gained: all,
        moves: ofType('move'),
        basicMoves: ofType('basic_move'),
        gear: ofType('gear'),
        features: [...ownFeatures, ...foreignFeatures],
    };
};

// The area a feature lives in, in its home playbook.
const areaOf = (path) => {
    const node = lookup(path);
    const home = lookup(path.split('.')[0]);
    return ['pre_moves', 'post_moves'].find((area) => home?.[area]?.includes(node)) ?? 'post_moves';
};

// Picks (including free text) inside a container: Combat Magic's bases and effects,
// Practitioner's effects, Arcane Reputation's organizations...
const picksUnder = (state, path) => state.picks.filter((p) => (p.path
    ? p.path.startsWith(`${path}.`) || p.container === path
    : p.container === path));

const crossedUnder = (state, path) => new Set(state.crosses
    .filter((c) => c.path.startsWith(`${path}.`))
    .map((c) => c.path));

// Basic moves by the rating they roll, for the ratings table.
const basicMovesByRating = (rating) => basicMoves.options.filter((move) => move.rating === rating);

export {
    RATINGS, IMPROVEMENT_LISTS,
    verbOf, countOf, findImprovement, choicesFor, ensureChoices, sameKey,
    hunterState, picksUnder, crossedUnder, basicMovesByRating,
};
