export class Hunter {
    uid = undefined;
    playbook = undefined;
    name = '';
    playbook_name = '';
    moves = undefined;
    harm = 0;
    unstable = 0;
    luck = 0;
    experience = 0;
    level = 0;
    stats = {
        charm: 0,
        cool: 0,
        sharp: 0,
        tough: 0,
        weird: 0
    };
    gear = undefined;

    constructor(playbook, name) {
        this.uid = Date.now();
        this.playbook = playbook;
        this.playbook_name = playbook.name;
        if (name) {
            this.name = name;
        }
        this.harm_max = playbook.harm_max;
        this.harm_unstable = playbook.harm_unstable;
        this.luck_max = playbook.luck_max;
        this.moves = [];
        this.gear = [];
        this.improvements = [];

        // Add IDs to the improvements
        const imp_ids = new Set();
        const pb_id = this.stringToId(this.playbook_name);
        this.playbook.improvements.options.forEach((improvement) => {
            const escaped = this.stringToId(improvement.description);
            let new_id = `${pb_id}-${escaped}-`;
            let i = 1;
            while (imp_ids.has(new_id+i)) {
                i++;
            }
            new_id = new_id+i;
            imp_ids.add(new_id);
            improvement.id = new_id;
        })
    }

    // string representation of the hunter
    toString() {
        return `${this.name || "<Nameless>"} the ${this.playbook_name || "<Unknown Playbook>"}`;
    }

    stringToId(str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
}