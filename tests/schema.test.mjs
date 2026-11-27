// The data files against the JSON Schemas in schema/ (hunters built in code are checked in
// engine.test.mjs).
import fs from 'node:fs';
import { check, finish } from './check.mjs';
import { validate } from './schema.mjs';
import { generateFiles } from '../schema/json2ts/regenerate.mjs';

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
check('rejects an unknown verb', validate('common.schema.json#/$defs/chooseRule', { verb: 'take', count: 1 }).length > 0, true);
check('rejects a rule without a count', validate('common.schema.json#/$defs/chooseRule', { verb: 'pick' }).length > 0, true);
check('rejects a bad reference', validate('common.schema.json#/$defs/reference', '@Bad Ref').length > 0, true);
const isPath = (ref) => validate('common.schema.json#/$defs/ref_path', ref).length === 0;
check('@this and @textbox are not paths', ['@this', '@textbox', '@this.x'].map(isPath),
    [false, false, true]);
const sample = json('samples/Dave Johnson the Spell-Slinger.json');
const hunterErrors = (changes) => validate('hunter.schema.json', { ...sample, ...changes }).length;
check('rejects a look key that is not an id', hunterErrors({ look: { 'Eyes!': 'x' } }) > 0, true);
check('rejects a bad date and a bad timestamp',
    [{ playbook_updated: '2026-13-01' }, { created: '2026-10-09T25:00:00Z' }].map(hunterErrors).map(Boolean),
    [true, true]);
const nodeErrors = (node) => validate('playbook.schema.json#/$defs/node', node).length;
check('a node needs an id or a name', [{}, { id: 'a' }, { name: 'A' }].map(nodeErrors).map(Boolean),
    [true, false, false]);

// The TypeScript declarations match the schemas
const typesDir = 'schema/json2ts';
const generated = await generateFiles();
const onDisk = fs.readdirSync(typesDir).filter((f) => f.endsWith('.d.ts'));
// (checkouts may turn LF into CRLF)
const read = (file) => fs.readFileSync(`${typesDir}/${file}`, 'utf8').replace(/\r\n/g, '\n');
const stale = [...new Set([...generated.keys(), ...onDisk])]
    .filter((file) => !onDisk.includes(file) || generated.get(file) !== read(file));
check('schema/json2ts is up to date (npm run schema:types)', stale, []);

finish();
