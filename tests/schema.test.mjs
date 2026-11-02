// The data files against the JSON Schemas in schema/ (hunters built in code are checked in
// engine.test.mjs).
import fs from 'node:fs';
import { check, finish } from './check.mjs';
import { validate } from './schema.mjs';

const json = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));

for (const file of fs.readdirSync('playbooks').filter((f) => f.endsWith('.json'))) {
    const schema = file === 'basic_moves.json' ? 'basic-moves.schema.json' : 'playbook.schema.json';
    check(`${file} matches ${schema}`, validate(schema, json(`playbooks/${file}`)), []);
}
for (const file of fs.readdirSync('samples').filter((f) => f.endsWith('.json'))) {
    check(`samples/${file} matches the hunter schema`, validate('hunter.schema.json', json(`samples/${file}`)), []);
}

// The schemas catch what they should
const pb = json('playbooks/the-expert.json');
check('rejects an unknown key', validate('playbook.schema.json', { ...pb, colour: 'red' }).length > 0, true);
check('rejects a rule with two verbs', validate('common.schema.json#/$defs/chooseRule', { pick: 1, cross: 1 }).length > 0, true);
check('rejects a bad reference', validate('common.schema.json#/$defs/reference', '@Bad Ref').length > 0, true);

finish();
