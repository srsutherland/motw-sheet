// Brings a hunter saved in an older format up to the current one (Hunter.js: SCHEMA_VERSION),
// one step per breaking change: each step takes a save from one format version to the next.
// A save in a version no step starts from is left as it is (and loads as "old format").

/**
 * Calls `visit` on every object in a tree, parents before children.
 * @param {*} node
 * @param {(object) => void} visit
 */
const eachObject = (node, visit) => {
    if (Array.isArray(node)) {
        node.forEach((child) => eachObject(child, visit));
    } else if (node && typeof node === 'object') {
        visit(node);
        Object.values(node).forEach((child) => eachObject(child, visit));
    }
};

/**
 * The hunter's own playbook copy, if it carries one (not a reference to the file).
 * @param {object} save
 * @returns {object | null}
 */
const playbookCopy = (save) => (typeof save.playbook === 'object' ? save.playbook : null);

// ---------------------------------------------------------------------------------------------
// DEPRECATED: the steps from 2026 formats. To be removed in 2027; saves still in those formats
// will then load as "old format".
// ---------------------------------------------------------------------------------------------

const VERBS = ['pick', 'cross', 'remove', 'attach'];

/**
 * 0.1.2026.10.16 -> 0.1.2026.11.24: choose rules name their verb and count
 * ({ "pick": 2 } -> { "verb": "pick", "count": 2 }).
 * @deprecated To be removed in 2027.
 * @param {object} save changed in place
 */
const chooseVerbAndCount = (save) => {
    const playbook = playbookCopy(save);
    if (!playbook) {
        return;
    }
    const convert = (rule) => {
        const verb = VERBS.find((v) => v in rule);
        if (!verb) {
            return rule;
        }
        const { from, [verb]: count, ...rest } = rule;
        return { ...(from ? { from } : {}), verb, count, ...rest };
    };
    eachObject(playbook, (node) => {
        if (node.choose) {
            node.choose = Array.isArray(node.choose)
                ? node.choose.map(convert)
                : convert(node.choose);
        }
    });
    playbook.schema_version = '0.1.2026.11.24';
};

// The old improvement list keys: the list's id and name now
const IMPROVEMENT_LISTS = {
    improvements: { id: 'basic', name: 'Improvements' },
    improvements_advanced: { id: 'advanced', name: 'Advanced Improvements' },
    improvements_mythic: { id: 'mythic', name: 'Mythic Improvements' },
};
// An old improvement reference: "@improvements.weird", "@improvements_advanced.any_rating"
const re_oldImprovementRef = /^@(improvements(?:_advanced|_mythic)?)\./;

/**
 * A playbook's look, as a container of traits:
 * { heading, clothes: { format, options } } -> { id, heading, options: [{ id, format, options }] }
 * @deprecated To be removed in 2027.
 * @param {object} look
 * @returns {object}
 */
const lookAsTraits = ({ heading, ...traits }) => ({
    id: 'look',
    ...(heading ? { heading } : {}),
    options: Object.entries(traits).map(([id, trait]) => ({ id, ...trait })),
});

/**
 * A playbook with its improvement lists under one container (`leveling_up`'s text as its
 * description), in place of `leveling_up` and the three lists, keeping the key order.
 * @deprecated To be removed in 2027.
 * @param {object} playbook
 * @returns {object}
 */
const improvementsAsContainer = (playbook) => {
    const lists = Object.entries(IMPROVEMENT_LISTS).filter(([key]) => playbook[key])
        .map(([key, { id, name }]) => {
            const { id: _, ...list } = playbook[key]; // eslint-disable-line no-unused-vars
            return { id, name, ...list };
        });
    const description = playbook.leveling_up?.description;
    const container = { id: 'improvements', ...(description ? { description } : {}), options: lists };
    const upgraded = {};
    for (const [key, value] of Object.entries(playbook)) {
        if (key === 'leveling_up' || key in IMPROVEMENT_LISTS) {
            upgraded.improvements ??= container;
        } else {
            upgraded[key] = value;
        }
    }
    return upgraded;
};

/**
 * A playbook's effects with `advance_basic` renamed `advance_basic_move`.
 * @deprecated To be removed in 2027.
 * @param {object} playbook changed in place
 */
const renameAdvanceBasic = (playbook) => eachObject(playbook, (node) => {
    if ('advance_basic' in node) {
        node.advance_basic_move = node.advance_basic;
        delete node.advance_basic;
    }
});

/**
 * 0.1.2026.11.24 -> 0.1.2026.11.25: look and the improvement lists are containers
 * (references to improvements gain the list: "@improvements.basic.weird"), and
 * `advance_basic` is `advance_basic_move`.
 * @deprecated To be removed in 2027.
 * @param {object} save changed in place
 */
const containersForLookAndImprovements = (save) => {
    const rename = (ref) => ref.replace(re_oldImprovementRef,
        (match, key) => `@improvements.${IMPROVEMENT_LISTS[key].id}.`);
    save.improvements = save.improvements.map((taken) => (typeof taken === 'string'
        ? rename(taken)
        : { ...taken, ref: rename(taken.ref) }));
    const playbook = playbookCopy(save);
    if (!playbook) {
        return;
    }
    playbook.look = lookAsTraits(playbook.look);
    renameAdvanceBasic(playbook);
    save.playbook = { ...improvementsAsContainer(playbook), schema_version: '0.1.2026.11.25' };
};

// ---------------------------------------------------------------------------------------------
// end of DEPRECATED
// ---------------------------------------------------------------------------------------------

// In order: each step's `from` is the previous step's `to`
const STEPS = [
    { from: '0.1.2026.10.16', to: '0.1.2026.11.24', upgrade: chooseVerbAndCount },
    { from: '0.1.2026.11.24', to: '0.1.2026.11.25', upgrade: containersForLookAndImprovements },
];

/**
 * A saved hunter brought up to the current format, as far as the steps go.
 * @param {object} data a saved hunter, as parsed (not changed)
 * @returns {object} a copy, upgraded; data itself if no step applies
 */
const upgradeSave = (data) => {
    if (!STEPS.some((step) => step.from === data?.schema_version)) {
        return data;
    }
    const save = structuredClone(data);
    for (const step of STEPS) {
        if (save.schema_version === step.from) {
            step.upgrade(save);
            save.schema_version = step.to;
        }
    }
    return save;
};

export { STEPS, upgradeSave };
