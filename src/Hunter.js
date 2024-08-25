export class Hunter {
    playbook = undefined;
    name = '';
    playbook_name = '';
    moves = [];
    harm = 0;
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
    }
}