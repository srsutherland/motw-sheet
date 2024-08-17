import spellslinger from "@pb/the-spellslinger.json";
const default_playbook_list = [
    spellslinger,
]

const default_playbooks_by_name = {};
default_playbook_list.forEach(playbook => {
    default_playbooks_by_name[playbook.name] = playbook;
});

const playbooks = default_playbook_list;
const playbooks_by_name = default_playbooks_by_name;

export { playbooks, playbooks_by_name };