import { toRaw } from 'vue';
import { asList, makeRecord } from '@/Hunter';
import { basicMoves } from '@/Playbooks';
import {
    TEXTBOX, PLACEABLE, isContainer, lookup, optionsOf, pathOf, refPath, resolve,
} from '@/PlaybookData';

// Everything about a hunter that's computed from its choices rather than stored
// (see plan/Schema Notes.md: "Getting started", "Choosing", "Placement", "Hunter JSON").

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

// Stored choices are references ("@the_spellslinger.moves.third_eye"), records with their
// own choices ({ ref, choose }), or free text ({ id: "@textbox", text }).
const refOf = (choice) => (typeof choice === 'string' ? choice : choice?.ref);
const pathOfChoice = (choice) => refOf(choice)?.slice(1);

// The hunter's { from, choices } for rule i of `holder`, inside `record` (the hunter-side
// object that mirrors the holder). Matched by `from`: the nth rule with a given `from`
// goes with the nth entry with that `from`.
const choiceSet = (record, holder, i) => {
    const rules = asList(holder?.choose);
    const from = rules[i]?.from;
    const nth = rules.slice(0, i).filter((rule) => rule.from === from).length;
    return (record?.choose ?? []).filter((set) => set.from === from)[nth] ?? null;
};

// The hunter-side record of something granted by `holder` (e.g. Tools and Techniques).
const grantRecord = (record, ref) => (record?.grant ?? []).find((g) => refOf(g) === ref);

// The record a picked option is stored as, inside a choice set (for its own choices).
const pickRecord = (set, path) => set?.choices.find((c) => typeof c === 'object'
    && c.ref === `@${path}`) ?? null;

// Pick or unpick an option. Options with their own choices are stored as { ref, choose }.
const toggleChoice = (set, path, node) => {
    const ref = `@${path}`;
    const at = set.choices.findIndex((choice) => refOf(choice) === ref);
    if (at >= 0) {
        set.choices.splice(at, 1);
    } else {
        set.choices.push(makeRecord(ref, node));
    }
};

// Set the nth free-text choice in a set ("" removes it).
const setTextChoice = (set, n, text) => {
    const existing = set.choices.filter((c) => c?.id === TEXTBOX)[n];
    text = text.trim();
    if (existing && text) {
        existing.text = text;
    } else if (existing) {
        set.choices.splice(set.choices.indexOf(existing), 1);
    } else if (text) {
        set.choices.push({ id: TEXTBOX, text });
    }
};

// The getting_started rules, each with the hunter's choice set and the absolute path of
// the container it picks from.
const gettingStartedRules = (h) => {
    const gs = h.playbook.getting_started;
    return asList(gs?.choose).map((rule, index) => ({
        rule,
        index,
        set: choiceSet(h.getting_started, gs, index),
        container: refPath(rule.from, h.playbook, gs),
    }));
};

const advancesBasicMoves = (holder) => (holder?.effects ?? []).some((e) => e.advance_basic);

// Replay every source of choices, in order: getting_started, each improvement in the
// order taken, then the choices that belong to items the hunter has gained.
const hunterState = (h) => {
    const root = h.playbook;
    const picks = []; // { path, node, text, container, source, set, advance }
    const crosses = []; // { path, container, source, set }
    const gained = new Map(); // path -> { node, source, record }
    const effects = []; // { effect, source }

    const gain = (node, source, record) => {
        const path = pathOf(node, root);
        if (path && !gained.has(path)) {
            gained.set(path, { node, source, record: typeof record === 'object' ? record : null });
        }
    };

    // `holder`: the playbook object with grant/choose/effects; `record`: the hunter's side
    const process = ({ holder, record, self, source }) => {
        for (const ref of asList(holder.grant)) {
            const node = resolve(ref, root, self);
            if (PLACEABLE.has(node?.type)) {
                gain(node, source, grantRecord(record, ref));
            } else if (isContainer(node)) {
                // granting a list grants everything in it (e.g. @basic_moves)
                for (const entry of optionsOf(ref, root, self)) {
                    if (PLACEABLE.has(entry.node?.type)) {
                        gain(entry.node, source);
                    }
                }
            }
        }
        const advance = advancesBasicMoves(holder);
        asList(holder.choose).forEach((rule, i) => {
            const set = choiceSet(record, holder, i);
            const verb = verbOf(rule);
            const container = rule.from.startsWith('@*.')
                ? rule.from
                : refPath(rule.from, root, self);
            for (const choice of set?.choices ?? []) {
                if (choice?.id === TEXTBOX) {
                    picks.push({ text: choice.text, container, source, set: toRaw(set) });
                    continue;
                }
                const path = pathOfChoice(choice);
                const node = lookup(path, root);
                if (verb === 'cross') {
                    crosses.push({ path, container, source, set: toRaw(set) });
                } else if (verb === 'remove') {
                    const at = picks.findIndex((p) => p.path === path);
                    if (at >= 0) {
                        picks.splice(at, 1);
                    }
                    gained.delete(path);
                } else if (node) {
                    picks.push({ path, node, container, source, set: toRaw(set), advance });
                    // marking a basic move advanced doesn't gain it
                    if (PLACEABLE.has(node.type) && !advance) {
                        gain(node, source, choice);
                    }
                    for (const effect of node.effects ?? []) {
                        effects.push({ effect, source });
                    }
                }
            }
        });
        for (const effect of holder.effects ?? []) {
            effects.push({ effect, source });
        }
    };

    process({
        holder: root.getting_started ?? {},
        record: h.getting_started,
        self: root.getting_started,
        source: 'getting_started',
    });
    for (const taken of h.improvements) {
        const found = findImprovement(root, taken.id);
        if (found) {
            const improvement = found.improvement;
            process({ holder: improvement, record: taken, self: improvement, source: taken.id });
        }
    }
    // Choices belonging to a gained item (Practitioner, Tools and Techniques, ...).
    // Gaining more items while doing this adds them to the end of the queue.
    const done = new Set();
    for (let more = true; more;) {
        more = false;
        for (const [path, { node, record }] of [...gained]) {
            if (!done.has(path) && node.choose) {
                done.add(path);
                more = true;
                process({ holder: { choose: node.choose }, record, self: node, source: path });
            }
        }
    }

    const all = [...gained.entries()]
        .map(([path, { node, source, record }]) => ({ path, node, source, record }));
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

    const advanced = new Set(picks.filter((p) => p.advance && p.node?.type === 'basic_move')
        .map((p) => p.path));

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

// Improvements taken (not counting one being picked right now).
const takenImprovements = (h) => h.improvements.filter((taken) => !taken.pending);

// What an improvement costs, in improvements (mythic: more than one).
const costOf = (playbook, id) => {
    const found = findImprovement(playbook, id);
    return found?.improvement.cost ?? found?.list.cost ?? 1;
};

// Each level up earns one improvement (DESIGN.md: level is separate from improvements).
const unspentImprovements = (h) => Math.max(0, h.level - takenImprovements(h)
    .reduce((sum, taken) => sum + (taken.cost ?? costOf(h.playbook, taken.id)), 0));

// Would this effect push a rating past its max? ("Get +1 Weird, max +3")
const overMax = (effect, state) => effect.rating !== undefined && effect.max !== undefined
    && state.ratings[effect.rating] + (effect.add ?? 0) > effect.max;

// The improvement lists, each with whether it's unlocked yet.
// `levelsBefore`: level ups completed before the one this improvement is for.
const improvementLists = (h, levelsBefore) => IMPROVEMENT_LISTS
    .filter((key) => h.playbook[key])
    .map((key) => {
        const list = h.playbook[key];
        const requires = list.requires ?? {};
        const unlocked = (requires.level === undefined || levelsBefore >= requires.level)
            && (requires.improvements === undefined
                || takenImprovements(h).length >= requires.improvements);
        return { key, list, unlocked };
    });

// Why an improvement can't be taken right now, or null if it can.
// `points`: improvements available to spend.
const improvementBlocked = (h, improvement, state, points) => {
    if (takenImprovements(h).some((taken) => taken.id === improvement.id)) {
        return 'already taken';
    }
    const cost = costOf(h.playbook, improvement.id);
    if (cost > points) {
        return `costs ${cost} improvements; you have ${points}`;
    }
    if ((improvement.effects ?? []).some((effect) => overMax(effect, state))) {
        return 'rating already at max';
    }
    for (const rule of asList(improvement.choose)) {
        const options = optionsOf(rule.from, h.playbook, improvement)
            .filter((entry) => entry.textbox || !(entry.node?.effects ?? [])
                .some((effect) => overMax(effect, state)));
        if (!options.length) {
            return rule.from.startsWith('@*.')
                ? 'no other playbooks yet'
                : 'nothing left to choose';
        }
    }
    return null;
};

// One-off effects, applied once when the improvement is taken ("Erase one used Luck mark").
// Ongoing effects (ratings) are computed in hunterState instead.
const applyOneOffEffects = (h, improvement) => {
    for (const effect of improvement.effects ?? []) {
        if (effect.luck) {
            h.luck = Math.min(h.luck_max, Math.max(0, h.luck + effect.luck));
        }
    }
};

// Basic moves by the rating they roll, for the ratings table.
const basicMovesByRating = (rating) => basicMoves.options.filter((move) => move.rating === rating);

export {
    RATINGS, IMPROVEMENT_LISTS,
    verbOf, countOf, findImprovement, refOf, pathOfChoice, choiceSet, grantRecord, pickRecord,
    toggleChoice, setTextChoice, gettingStartedRules, advancesBasicMoves,
    hunterState, picksUnder, crossedUnder, basicMovesByRating,
    takenImprovements, costOf, unspentImprovements, overMax, improvementLists, improvementBlocked,
    applyOneOffEffects,
};
