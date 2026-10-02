const SCHEMA_VERSION = '0.1';

// A `choose` or `grant` may be one rule or a list of them.
const asList = (value) => (value === undefined ? [] : [].concat(value));

class Hunter {
    schema_version = SCHEMA_VERSION;
    uid = undefined;
    playbook = undefined; // the hunter's own, modifiable copy (DESIGN.md: "full" hunter JSON)
    playbook_name = '';
    name = '';
    pronouns = '';
    look = {}; // look list key -> text
    ratings_base = null; // a copy of the chosen ratings line
    history = []; // { name, option, notes }
    getting_started = []; // choices, one list per getting_started choose
    nested = {}; // item path -> choices, one list per choose on that item
    improvements = []; // { id, choices }, in the order taken
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
        if (name) {
            this.name = name;
        }
        this.getting_started = asList(playbook.getting_started?.choose).map(() => []);
    }

    // Returns null for data saved in an older format.
    static fromJSON(data) {
        if (data?.schema_version !== SCHEMA_VERSION) {
            return null;
        }
        return Object.assign(Object.create(Hunter.prototype), data);
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

    // string representation of the hunter
    toString() {
        return `${this.name || '<Nameless>'} the ${this.playbook_name || '<Unknown Playbook>'}`;
    }
}

export { Hunter, SCHEMA_VERSION, asList };
