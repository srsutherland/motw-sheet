// TypeScript declarations for the schemas in schema/, for reading them: one
// <name>.schema.d.ts per schema, plus index.d.ts, in this folder.
//   node schema/json2ts/regenerate.mjs           write them
//   node schema/json2ts/regenerate.mjs --watch   and again whenever a schema changes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.dirname(here);

const schemaFiles = () => fs.readdirSync(schemaDir)
    .filter((f) => f.endsWith('.schema.json')).sort();

// Type names in code: not in comments or string literals, and not the declared names.
const namesUsed = (decls) => new Set(decls.join('\n')
    .replace(/\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|export (?:type|interface) \w+/g, '')
    .match(/\b[A-Z]\w*\b/g));

// Declarations by file name: "common.schema.d.ts" -> its contents.
const generate = async () => {
    const schemas = new Map(); // file name -> schema, as json2ts will read it
    const owner = new Map(); // type name -> the module that declares it ("common.schema")
    const properties = {};
    for (const file of schemaFiles()) {
        const module = file.replace(/\.json$/, '');
        const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
        // json2ts names a $def after its key only in the root schema being compiled, or
        // when it's an object or array; in other files, strings and unions are inlined.
        // A title always names it, so each untitled def gets its key.
        for (const [key, definition] of Object.entries(schema.$defs ?? {})) {
            definition.title ??= key;
            owner.set(toSafeString(definition.title), module);
        }
        schemas.set(file, schema);
        // common.schema.json has only $defs; its types come in through references.
        if (schema.properties) {
            if (schema.title) {
                owner.set(toSafeString(schema.title), module);
            }
            properties[file.replace(/\.schema\.json$/, '').replaceAll('-', '_')] = { $ref: file };
        }
    }

    // json2ts compiles one root at a time and declares everything it reaches, so compile
    // one index that refers to each root schema, then split the result into modules.
    const index = { title: 'Index', type: 'object', properties };
    let text = await compile(index, 'Index', {
        cwd: schemaDir,
        additionalProperties: false,
        $refOptions: {
            resolve: {
                schemas: {
                    order: 1,
                    canRead: /\.schema\.json$/,
                    read: (file) => JSON.stringify(schemas.get(file.url.split(/[\\/]/).pop())),
                },
            },
        },
    });

    // A blank line before each top-level doc comment or export, unless it follows a doc comment
    text = text.replace(/(?<! \*\/\n)^(?=export |\/\*\*)/gm, '\n');
    const [banner, ...chunks] = text.trim().split(/\n\n+(?=\/\*\*|export )/);
    const named = chunks
        .map((chunk) => [chunk.match(/^export (?:type|interface) (\w+)/m)[1], chunk])
        .filter(([name]) => name !== 'Index');

    // Copies json2ts makes for a description beside a $ref (Timestamp1, Playbook1) go with
    // the original's module, or nowhere if nothing uses them.
    const used = namesUsed(named.map(([, chunk]) => chunk));
    const modules = new Map(); // module -> declarations
    const declared = new Map(); // type name -> module
    for (const [name, chunk] of named) {
        if (/\d$/.test(name) && !used.has(name)) {
            continue;
        }
        let module = owner.get(name) ?? owner.get(name.replace(/\d+$/, ''));
        if (!module) {
            console.warn(`warning: no schema owns ${name}; putting it in misc.d.ts`);
            module = 'misc';
        }
        modules.set(module, [...(modules.get(module) ?? []), chunk]);
        declared.set(name, module);
    }

    const files = new Map();
    for (const [module, decls] of modules) {
        const imports = new Map(); // source module -> names
        for (const name of [...namesUsed(decls)].sort()) {
            const source = declared.get(name) ?? module;
            if (source !== module) {
                imports.set(source, [...(imports.get(source) ?? []), name]);
            }
        }
        const importLines = [...imports].sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([source, names]) => `import type { ${names.join(', ')} } from "./${source}";`);
        const parts = [banner, ...(importLines.length ? [importLines.join('\n')] : []), ...decls];
        files.set(`${module}.d.ts`, `${parts.join('\n\n')}\n`);
    }
    files.set('index.d.ts', [...modules.keys()].sort()
        .map((module) => `export * from "./${module}";\n`).join(''));
    return files;
};

// Replace this folder's declarations with freshly generated ones.
const write = async () => {
    const files = await generate();
    for (const old of fs.readdirSync(here).filter((f) => f.endsWith('.d.ts'))) {
        fs.unlinkSync(path.join(here, old));
    }
    for (const [file, contents] of files) {
        fs.writeFileSync(path.join(here, file), contents);
    }
    console.log(`Wrote ${[...files.keys()].join(', ')}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await write();
    if (process.argv.includes('--watch')) {
        // Editors save in bursts (and fs.watch can fire twice): wait for a quiet moment
        let timer;
        fs.watch(schemaDir, (event, file) => {
            if (file?.endsWith('.schema.json')) {
                clearTimeout(timer);
                timer = setTimeout(() => write().catch((e) => console.error(e.message)), 200);
            }
        });
        console.log(`Watching ${schemaDir}`);
    }
}

export { generate };
