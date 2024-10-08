export class Hunter {
    playbook = undefined;
    name = '';
    playbook_name = '';
    moves = [];
    harm = 0;
    unstable = 0;
    luck = 0;
    experience = 0;
    stats = {
        charm: 0,
        cool: 0,
        sharp: 0,
        tough: 0,
        weird: 0
    };

    constructor(playbook, name) {
        this.playbook = playbook;
        this.playbook_name = playbook.name;
        if (name) {
            this.name = name;
        }
        this.harm_max = playbook.harm_max;
        this.harm_unstable = playbook.harm_unstable;
        this.luck_max = playbook.luck_max;
    }
}