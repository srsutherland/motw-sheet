// TypeScript declarations for the schemas in schema/, for reading them: one
// <name>.schema.d.ts per schema, plus index.d.ts, in this folder.
//   node schema/json2ts/regenerate.mjs           write them
//   node schema/json2ts/regenerate.mjs --watch   and again whenever a schema changes
//
// json2ts's compile() takes one schema and returns one file of text, so this runs its
// stages itself, as compile() does, to get at the parsed types: each is generated on its
// own, in its schema's file. The stages aren't json2ts's public API, so its version is
// pinned. Each workaround for json2ts's behavior says what it fixes (FIXES:).
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

// Where a schema came from, written into json2ts's copy of it:
// "common.schema.json#/$defs/dateString" for a $def, "hunter.schema.json#" for a whole file.
// json2ts parses each schema object once, so the types it makes from it can be traced back
// to it (see parseSchemas).
const SOURCE = 'x-source';

const re_schemaFile = /\.schema\.json$/;
const re_defKey = /#\/\$defs\/(\w+)$/;

/**
 * The schemas as json2ts gets them: tagged with their sources, and with each $ref beside
 * other keywords wrapped.
 * @returns {Map<string, object>} file name ("common.schema.json") -> schema, in file name order
 */
const readSchemas = () => {
    const schemas = new Map();
    for (const file of fs.readdirSync(schemaDir).filter((f) => re_schemaFile.test(f)).sort()) {
        const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
        tagSources(file, schema);
        wrapRefsWithSiblings(schema);
        schemas.set(file, schema);
    }
    return schemas;
};

/**
 * Tags a schema file and each of its $defs with its SOURCE.
 * FIXES: json2ts keeps no reliable record of where a type came from (references within a
 * file are recorded without the file; circular ones not at all), so types couldn't be named
 * after their $def keys (defName) or put in their schemas' files (generateFiles).
 * @param {string} file "common.schema.json"
 * @param {object} schema its contents, tagged in place
 */
const tagSources = (file, schema) => {
    schema[SOURCE] = `${file}#`;
    for (const [key, definition] of Object.entries(schema.$defs ?? {})) {
        definition[SOURCE] = `${file}#/$defs/${key}`;
    }
};

/**
 * Rewrites each $ref beside other keywords as an allOf of the one $ref, which means the same.
 * FIXES: for a $ref beside a description (hunter's `updated`), json2ts declares a numbered
 * copy of the target (Timestamp1 beside Timestamp) and puts the description on that, not on
 * the property; if the copy is parsed first, it takes the name and the original gets the
 * number (Playbook got the hunter's description of its `playbook`).
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
 * Where a schema json2ts is parsing came from.
 * FIXES: json2ts splits a schema with allOf beside other keywords (a move: allOf node, plus
 * its own `type`) in two: a new intersection schema, which stands for it and takes its name,
 * and the rest. The new one has no tag, and the rest still has it: read as they are, the move
 * type would have no source, and the rest would be named too (Move1).
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
 * The type name for a $def: its key. Whole files keep their titles.
 * FIXES: json2ts names a $def by its key only in the schema it compiles, or when it's an
 * object or array; a string or union $def from another file is inlined wherever it's used
 * (`string` for every Markdown).
 * @param {object} schema
 * @returns {string | undefined}
 */
const defName = (schema) => sourceOfSchema(schema)?.match(re_defKey)?.[1];

/**
 * json2ts's options.
 * @param {Map<string, object>} schemas from readSchemas
 * @returns {object}
 */
const json2tsOptions = (schemas) => ({
    ...j2ts.DEFAULT_OPTIONS,
    cwd: `${schemaDir}/`,
    // FIXES: an object that doesn't say additionalProperties (a move) would get an
    // index signature, [k: string]: unknown
    additionalProperties: false,
    // FIXES: an array with minItems (paragraphs) would be a tuple,
    // [Markdown, ...Markdown[]], instead of Markdown[]
    ignoreMinAndMaxItems: true,
    // Each file gets its own (banner)
    bannerComment: '',
    customName: defName,
    // FIXES: json2ts would read the files a $ref points to from disk, without the tags and
    // wrapping from readSchemas
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
 * A schema that refers to each schema file with properties, to parse them all at once.
 * (common.schema.json has only $defs; its types come in through references.)
 * FIXES: parsed one at a time, each file would declare its own copies of the types it
 * shares with the others (Markdown in every file).
 * @param {Map<string, object>} schemas from readSchemas
 * @returns {object}
 */
const indexSchema = (schemas) => {
    const roots = [...schemas.keys()].filter((file) => schemas.get(file).properties);
    return {
        title: 'Index',
        type: 'object',
        properties: Object.fromEntries(roots.map((file) => [file, { $ref: file }])),
    };
};

/**
 * Parses the schemas into json2ts's AST: the stages of its compile() before code generation.
 * @param {Map<string, object>} schemas from readSchemas
 * @param {object} options from json2tsOptions
 * @returns {Promise<{ index: object, sourceOf: Map<object, string> }>} the index schema's
 *     AST, and each named type's SOURCE
 */
const parseSchemas = async (schemas, options) => {
    const index = indexSchema(schemas);
    j2ts.normalizeNullableRefs(index);
    const { dereferencedPaths, dereferencedSchema } = await j2ts.dereference(index, options);
    const linked = j2ts.link(dereferencedSchema);
    const errors = j2ts.validate(linked, 'Index');
    if (errors.length) {
        throw new Error(errors.join('\n'));
    }
    const normalized = j2ts.normalize(linked, dereferencedPaths, 'Index', options);
    const processed = new Map(); // filled by parse: schema -> its ASTs, by kind
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
 * A copy of a named type's AST in which each named type under it is just its name (an AST
 * node json2ts prints as-is), so that generating it declares only this type; and the named
 * types it refers to, for its file's imports.
 * FIXES: generating a type alias also declares the named types in it (Option would declare
 * Reference and PlainText too), so they'd be declared again in the wrong files.
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
 * Every named type the index refers to, directly or not (but not the index itself).
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
 * @param {string} source a SOURCE ("common.schema.json#/$defs/dateString")
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
 * A module's declarations, importing the types it uses from other modules, formatted the
 * way compile() formats its output.
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
