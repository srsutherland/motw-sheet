import spellslinger from '@pb/the-spellslinger.json';
import basicMoves from '@pb/basic_moves.json';

const playbooks = [
    spellslinger,
];

// Every data file, by id: the namespaces an absolute reference can start with.
const files = new Map([...playbooks, basicMoves].map((file) => [file.id, file]));

export { playbooks, basicMoves, files };
