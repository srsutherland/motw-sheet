// The JSON Schemas in schema/, compiled with ajv: validate(name, data) -> list of errors.
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const dir = new URL('../schema/', import.meta.url);

const loadSchemas = () => {
    const ajv = new Ajv2020({ allErrors: true });
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.schema.json'))) {
        ajv.addSchema(JSON.parse(fs.readFileSync(new URL(file, dir), 'utf8')));
    }
    return ajv;
};

const ajv = loadSchemas();

// `name`: a schema's $id, e.g. "playbook.schema.json". Errors as "path: message" strings.
const validate = (name, data) => {
    const check = ajv.getSchema(name);
    if (!check) {
        throw new Error(`no schema ${name}`);
    }
    return check(data)
        ? []
        : check.errors.map((e) => `${e.instancePath || '/'}: ${e.message}`
            + (e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''));
};

export { validate };
