import { resolve } from '@/PlaybookData';

// Date of the last breaking change to the hunter format (0.1.yyyy.mm.dd, plus .1, .2...
// if it breaks again on a day it was already pushed).
const SCHEMA_VERSION = '0.1.2026.10.07';

// A `choose` or `grant` may be one rule or a list of them.
const asList = (value) => (value === undefined ? [] : [].concat(value));

// The hunter's side of a playbook object's `choose`: one { from, choices } per rule,
// mirroring the playbook (see plan/Schema Notes.md: "Hunter JSON").
const makeChoose = (holder) => asList(holder?.choose)
    .map((rule) => ({ from: rule.from, choices: [] }));

// A pick or grant that has its own choices (Practitioner, Tools and Techniques) is stored
// as { ref, choose }; anything else is just its reference.
const makeRecord = (ref, node) => (node?.choose ? { ref, choose: makeChoose(node) } : ref);

// "{name} the {playbook}"; playbook names already start with "The"
const hunterTitle = (name, playbookName) => {
    const playbook = (playbookName || '<Unknown Playbook>').replace(/^the\s+/i, '');
    return `${name || '<Nameless>'} the ${playbook}`;
};

class Hunter {
    schema_version = SCHEMA_VERSION;
    uid = undefined;
    playbook = undefined; // the hunter's own, modifiable copy (DESIGN.md: "full" hunter JSON)
    playbook_name = '';
    playbook_updated = ''; // the playbook's "updated" date when this hunter was made
    name = '';
    pronouns = '';
    look = {}; // look list key -> text
    ratings_base = null; // a copy of the chosen ratings line
    history = []; // { name, option, notes }
    getting_started = undefined; // { grant, choose }, mirroring the playbook's getting_started
    improvements = []; // { id, choose }, in the order taken
    extra_gear = []; // gear added during play: { name, tags }
    harm = 0;
    unstable = false;
    luck = 0;
    experience = 0;
    level = 0;

    constructor(playbook, name) {
        this.uid = crypto.randomUUID();
        this.playbook = structuredClone(playbook);
        this.playbook_name = playbook.name;
        this.playbook_updated = playbook.updated ?? '';
        if (name) {
            this.name = name;
        }
        const gs = this.playbook.getting_started;
        this.getting_started = {
            grant: asList(gs?.grant).map((ref) => makeRecord(ref, resolve(ref, this.playbook, gs))),
            choose: makeChoose(gs),
        };
    }

    // Returns null for data saved in an older format.
    static fromJSON(data) {
        if (data?.schema_version !== SCHEMA_VERSION) {
            return null;
        }
        // computed on save, for readers of the file; recomputed here
        const { ratings, moves, ...stored } = data; // eslint-disable-line no-unused-vars
        const hunter = Object.assign(Object.create(Hunter.prototype), stored);
        // an improvement still being picked when the page was closed
        hunter.improvements = hunter.improvements.filter((taken) => !taken.pending);
        // improvements without choices have no `choose` (files from 2026-10-07 had "choose": [])
        for (const taken of hunter.improvements) {
            if (taken.choose?.length === 0) {
                delete taken.choose;
            }
        }
        return hunter;
    }

    get harm_max() {
        return this.playbook.harm.max;
    }

    get harm_unstable() {
        return this.playbook.harm.unstable;
    }

    get luck_max() {
        return this.playbook.luck.max;
    }

    // string representation of the hunter: "Alice the Spell-Slinger"
    toString() {
        return hunterTitle(this.name, this.playbook_name);
    }
}

export { Hunter, SCHEMA_VERSION, asList, makeChoose, makeRecord, hunterTitle };
