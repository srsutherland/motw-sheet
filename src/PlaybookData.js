import { toRaw } from 'vue';
import { files } from '@/Playbooks';

// Ids, paths, and references for playbook data (see plan/Schema Notes.md).
// Nothing here modifies the data it reads. Works on raw objects, so a reactive
// hunter's playbook copy and the same object unwrapped index the same way.

const TEXTBOX = '@textbox';

// Auto id from a name: "Could've Been Worse" -> "couldve_been_worse"
const slug = (name) => name.toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const idOf = (node) => node.id ?? (node.name ? slug(node.name) : null);

// Things that can be placed on a hunter; anything else with options is a container.
const PLACEABLE = new Set(['move', 'basic_move', 'feature', 'gear']);

// Per data file (or hunter's copy of a playbook): path -> node, and node -> path.
// Paths follow ids, not JSON keys: "the_spellslinger.combat_magic.bases.blast"
const indexes = new WeakMap();

const indexOf = (root) => {
    root = toRaw(root);
    let index = indexes.get(root);
    if (index) {
        return index;
    }
    index = { byPath: new Map(), pathOf: new WeakMap() };
    const walk = (node, path) => {
        if (Array.isArray(node)) {
            node.forEach((child) => walk(child, path));
            return;
        }
        if (!node || typeof node !== 'object') {
            return;
        }
        const id = node === root ? root.id : idOf(node);
        if (id) {
            path = path ? `${path}.${id}` : id;
            index.byPath.set(path, node);
            index.pathOf.set(node, path);
        }
        for (const value of Object.values(node)) {
            if (typeof value === 'object') {
                walk(value, path);
            }
        }
    };
    walk(root, '');
    indexes.set(root, index);
    return index;
};

// The file a namespace refers to. A hunter's own playbook copy wins over the library's.
const fileFor = (namespace, root) => (root?.id === namespace ? toRaw(root) : files.get(namespace));

const lookup = (path, root) => {
    const file = fileFor(path.split('.')[0], root);
    return file ? indexOf(file).byPath.get(path) ?? null : null;
};

const pathOf = (node, root) => {
    node = toRaw(node);
    if (root) {
        const path = indexOf(root).pathOf.get(node);
        if (path) {
            return path;
        }
    }
    for (const file of files.values()) {
        const path = indexOf(file).pathOf.get(node);
        if (path) {
            return path;
        }
    }
    return null;
};

// Absolute path for a reference written inside `root` (a playbook), in the object `self`.
// Root-relative unless the first segment is a known namespace (a playbook id, basic_moves).
const refPath = (ref, root, self) => {
    if (ref === '@this') {
        return pathOf(self, root);
    }
    const path = ref.slice(1);
    const first = path.split('.')[0];
    if (files.has(first) || first === root?.id || !root) {
        return path;
    }
    return `${root.id}.${path}`;
};

const resolve = (ref, root, self) => {
    if (ref === '@this') {
        return toRaw(self);
    }
    return lookup(refPath(ref, root, self), root);
};

const isContainer = (node) => node && typeof node === 'object' && Array.isArray(node.options)
    && !PLACEABLE.has(node.type);

// The options a `from` reference offers, flattened, each with the sub-list it came from.
// Entries: { key, path, node, group, written } or { key, textbox: true, group, written }
// `written` is how a choice of it is stored (plan/Schema Notes.md: "Hunter JSON"): relative
// to the container ("@bases.blast"), or as written in the container if the option is itself
// a reference ("@basic_moves.use_magic.heal"), or absolute for "@*." lists.
const optionsOf = (ref, root, self) => {
    if (ref.startsWith('@*.')) {
        // e.g. "@*.moves": that list in every other playbook
        const id = ref.slice(3);
        return [...files.values()]
            .filter((file) => file.type === 'playbook' && file.id !== root.id)
            .flatMap((file) => optionsOf(`@${file.id}.${id}`, root, self)
                .map((entry) => ({
                    ...entry,
                    group: entry.group ?? file.name,
                    written: entry.path ? `@${entry.path}` : entry.written,
                })));
    }
    const container = resolve(ref, root, self);
    if (!container?.options) {
        return [];
    }
    const containerPath = pathOf(container, root);
    const relative = (path) => (path.startsWith(`${containerPath}.`)
        ? `@${path.slice(containerPath.length + 1)}`
        : `@${path}`);
    const entries = [];
    let textboxes = 0;
    const add = (options, group) => {
        for (const option of options) {
            if (option === TEXTBOX) {
                entries.push({ key: `${TEXTBOX}#${textboxes++}`, textbox: true, group, written: TEXTBOX });
            } else if (typeof option === 'string') {
                const node = resolve(option, root, self);
                if (node) {
                    const path = refPath(option, root, self);
                    entries.push({ key: path, path, node, group, written: option });
                }
            } else if (option.type === undefined && Array.isArray(option.options)) {
                // a sub-list, e.g. Combat Magic's bases
                add(option.options, option);
            } else {
                const path = pathOf(option, root);
                entries.push({ key: path, path, node: option, group, written: relative(path) });
            }
        }
    };
    add(container.options, null);
    return entries;
};

export {
    TEXTBOX, PLACEABLE,
    slug, idOf, indexOf, lookup, pathOf, refPath, resolve, isContainer, optionsOf,
};
