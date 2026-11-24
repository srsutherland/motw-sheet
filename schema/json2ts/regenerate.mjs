// TypeScript declarations for the schemas in schema/, for reading them: one
// <name>.schema.d.ts per schema, plus index.d.ts, in this folder.
//   node schema/json2ts/regenerate.mjs           write them
//   node schema/json2ts/regenerate.mjs --watch   and again whenever a schema changes
//
// json2ts's compile() puts every type in one file, so this runs its stages itself (as
// compile() does) and generates each named type on its own, in its schema's file. The
// stages aren't json2ts's public API, so its version is pinned.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// json2ts's modules as one namespace (no two share an export name)
const require = createRequire(import.meta.url);
const j2ts = Object.assign({}, ...[
    'index', 'formatter', 'generator', 'linker', 'normalizer', 'optimizer', 'parser',
    'resolver', 'types/JSONSchema', 'utils', 'validator',
].map((module) => require(`json-schema-to-typescript/dist/src/${module}.js`)));

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.dirname(here);

// Where a schema came from, written into json2ts's copy of it: "common.schema.json#/$defs/date"
// for a $def, "hunter.schema.json#" for a whole file.
const SOURCE = 'x-source';

const re_schemaFile = /\.schema\.json$/;
const re_defKey = /#\/\$defs\/(\w+)$/;

/**
 * The schemas as json2ts gets them: each file and $def tagged with its SOURCE, and each $ref
 * beside other keywords wrapped (see wrapRefsWithSiblings).
 * @returns {Map<string, object>} file name ("common.schema.json") -> schema, in file name order
 */
const readSchemas = () => {
    const schemas = new Map();
    for (const file of fs.readdirSync(schemaDir).filter((f) => re_schemaFile.test(f)).sort()) {
        const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
        schema[SOURCE] = `${file}#`;
        for (const [key, definition] of Object.entries(schema.$defs ?? {})) {
            definition[SOURCE] = `${file}#/$defs/${key}`;
        }
        wrapRefsWithSiblings(schema);
        schemas.set(file, schema);
    }
    return schemas;
};

/**
 * A $ref beside other keywords (a description) means the target and them both. json2ts
 * declares a copy of the target with them instead (Timestamp1 beside Timestamp); an allOf
 * of the one $ref means the same, and leaves the description on the property.
 * @param {object} schema rewritten in place, with everything under it
 */
const wrapRefsWithSiblings = (schema) => {
    if (schema.$ref && Object.keys(schema).length > 1) {
        schema.allOf = [{ $ref: schema.$ref }];
        delete schema.$ref;
    }
    for (const value of Object.values(schema)) {
        if (value && typeof value === 'object') {
            wrapRefsWithSiblings(value);
        }
    }
};

/**
 * Where a schema json2ts is parsing came from. json2ts splits a schema with allOf beside
 * other keywords (a move) in two: an intersection, which stands for it, and the rest.
 * @param {object} schema
 * @returns {string | undefined} its SOURCE, if it's a file or a $def
 */
const sourceOfSchema = (schema) => {
    if (schema[j2ts.Parent]?.[j2ts.Intersection] === schema) {
        return schema[j2ts.Parent][SOURCE];
    }
    return schema[j2ts.Intersection] ? undefined : schema[SOURCE];
};

/**
 * The type name for a $def: its key. (json2ts names a $def by its key only in the schema
 * it compiles, or when it's an object or array; elsewhere, a string or a union is inlined.)
 * Whole files keep their titles.
 * @param {object} schema
 * @returns {string | undefined}
 */
const defName = (schema) => sourceOfSchema(schema)?.match(re_defKey)?.[1];

/**
 * json2ts's options, reading the schemas from memory.
 * @param {Map<string, object>} schemas from readSchemas
 * @returns {object}
 */
const json2tsOptions = (schemas) => ({
    ...j2ts.DEFAULT_OPTIONS,
    cwd: `${schemaDir}/`,
    additionalProperties: false,
    bannerComment: '',
    customName: defName,
    $refOptions: {
        resolve: {
            schemas: {
                order: 1,
                canRead: re_schemaFile,
                read: (file) => JSON.stringify(schemas.get(path.basename(file.url))),
            },
        },
    },
});

/**
 * Parses the schemas together, through the stages of json2ts's compile() before code
 * generation: an index schema refers to each file with properties, so they share their
 * types. (common.schema.json has only $defs; its types come in through references.)
 * @param {Map<string, object>} schemas from readSchemas
 * @param {object} options from json2tsOptions
 * @returns {Promise<{ index: object, sourceOf: Map<object, string> }>} the index's AST, and
 *     each named type's SOURCE
 */
const parseSchemas = async (schemas, options) => {
    const roots = [...schemas.keys()].filter((file) => schemas.get(file).properties);
    const index = {
        title: 'Index',
        type: 'object',
        properties: Object.fromEntries(roots.map((file) => [file, { $ref: file }])),
    };
    j2ts.normalizeNullableRefs(index);
    const { dereferencedPaths, dereferencedSchema } = await j2ts.dereference(index, options);
    const linked = j2ts.link(dereferencedSchema);
    const errors = j2ts.validate(linked, 'Index');
    if (errors.length) {
        throw new Error(errors.join('\n'));
    }
    const normalized = j2ts.normalize(linked, dereferencedPaths, 'Index', options);
    const processed = new Map(); // schema -> its ASTs, by kind
    const usedNames = new Set();
    const ast = j2ts.parse(normalized, options, undefined, processed, usedNames);
    j2ts.nameAnonymousRecursiveTypes(ast, processed, dereferencedPaths, usedNames);

    const sourceOf = new Map();
    for (const [schema, asts] of processed) {
        for (const node of asts.values()) {
            if (node.standaloneName) {
                sourceOf.set(node, sourceOfSchema(schema));
            }
        }
    }
    return { index: j2ts.optimize(ast, options), sourceOf };
};

/**
 * A named type's AST with each named type under it reduced to its name, so that generating
 * it declares only this type; and the named types it refers to.
 * @param {object} ast a named type
 * @returns {{ outline: object, refs: Set<object> }}
 */
const outline = (ast) => {
    const refs = new Set();
    // The branches json2ts's generator follows
    const visit = (node) => {
        if (node !== ast && node.standaloneName) {
            refs.add(node);
            return { type: 'CUSTOM_TYPE', params: j2ts.toSafeString(node.standaloneName) };
        }
        switch (node.type) {
            case 'ARRAY':
                return { ...node, params: visit(node.params) };
            case 'INTERFACE':
                node.superTypes.forEach((superType) => refs.add(superType));
                return {
                    ...node,
                    params: node.params.map((param) => ({ ...param, ast: visit(param.ast) })),
                };
            case 'INTERSECTION':
            case 'UNION':
                return { ...node, params: node.params.map(visit) };
            case 'TUPLE':
                return {
                    ...node,
                    params: node.params.map(visit),
                    spreadParam: node.spreadParam && visit(node.spreadParam),
                };
            default:
                return node;
        }
    };
    return { outline: visit(ast), refs };
};

/**
 * Every named type the index refers to, directly or not.
 * @param {object} index from parseSchemas
 * @returns {Map<object, { outline: object, refs: Set<object> }>} named type -> its outline
 */
const namedTypes = (index) => {
    const types = new Map();
    const queue = [...outline(index).refs];
    for (const ast of queue) {
        if (!types.has(ast)) {
            types.set(ast, outline(ast));
            queue.push(...types.get(ast).refs);
        }
    }
    return types;
};

/**
 * The module a type is declared in: its schema file's.
 * @param {string} source a SOURCE ("common.schema.json#/$defs/date")
 * @returns {string} "common.schema"
 */
const moduleOf = (source) => source.split('#')[0].replace(/\.json$/, '');

/**
 * The comment at the top of each generated file.
 * @param {string} source what it's generated from
 * @returns {string}
 */
const banner = (source) => `/**
 * This file was automatically generated from ${source}
 * by \`./regenerate.mjs\`, using \`json-schema-to-typescript\`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run \`npm run schema:types\` to regenerate this file.
 */`;

/**
 * A module's declarations, importing the types it uses from other modules.
 * @param {string} module "common.schema"
 * @param {{ outline: object, refs: Set<object> }[]} types its types, in order
 * @param {Map<object, string>} sourceOf from parseSchemas
 * @param {object} options from json2tsOptions
 * @returns {Promise<string>}
 */
const moduleFile = async (module, types, sourceOf, options) => {
    const imports = new Map(); // module -> type names
    for (const ref of types.flatMap(({ refs }) => [...refs])) {
        const from = moduleOf(sourceOf.get(ref));
        if (from !== module) {
            const names = imports.get(from) ?? new Set();
            imports.set(from, names.add(j2ts.toSafeString(ref.standaloneName)));
        }
    }
    const importLines = [...imports].sort(([a], [b]) => a.localeCompare(b))
        .map(([from, names]) => `import type {${[...names].sort().join(', ')}} from "./${from}";`);
    const code = [
        banner(`\`../${module}.json\``),
        importLines.join('\n'),
        ...types.map((type) => j2ts.generate(type.outline, options)),
    ];
    return j2ts.format(code.filter(Boolean).join('\n\n'), options);
};

/**
 * The declaration files.
 * @returns {Promise<Map<string, string>>} file name ("common.schema.d.ts") -> contents
 */
const generateFiles = async () => {
    const schemas = readSchemas();
    const options = json2tsOptions(schemas);
    const { index, sourceOf } = await parseSchemas(schemas, options);

    const typeOf = new Map(); // SOURCE -> outlined type
    for (const [ast, type] of namedTypes(index)) {
        if (!sourceOf.get(ast)) {
            throw new Error(`json2ts named ${ast.standaloneName}, which isn't a schema or a $def`);
        }
        typeOf.set(sourceOf.get(ast), type);
    }

    // Each module in schema order: the file's own type, then its $defs
    const files = new Map();
    for (const [file, schema] of schemas) {
        const sources = [schema, ...Object.values(schema.$defs ?? {})].map((s) => s[SOURCE]);
        const types = sources.map((source) => typeOf.get(source)).filter(Boolean);
        if (types.length) {
            const module = moduleOf(file);
            files.set(`${module}.d.ts`, await moduleFile(module, types, sourceOf, options));
        }
    }
    const exportLines = [...files.keys()]
        .map((file) => `export * from "./${file.replace(/\.d\.ts$/, '')}";`);
    files.set('index.d.ts', [banner('the schemas in `../`'), '', ...exportLines, ''].join('\n'));
    return files;
};

/**
 * Replaces this folder's declaration files with freshly generated ones.
 */
const write = async () => {
    const files = await generateFiles();
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
            if (re_schemaFile.test(file ?? '')) {
                clearTimeout(timer);
                timer = setTimeout(() => write().catch((e) => console.error(e.message)), 200);
            }
        });
        console.log(`Watching ${schemaDir}`);
    }
}

export { generateFiles };
