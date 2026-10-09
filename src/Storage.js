import { Hunter, hunterTitle } from '@/Hunter';
import { hunterState, picksUnder } from '@/HunterState';
import { TEXTBOX } from '@/PlaybookData';

// Each hunter is stored under its own key, so saving one doesn't rewrite the rest.
const PREFIX = 'motw-sheet.hunter.';

// A pick as it's stored: a reference, or free text.
const storedPick = (pick) => (pick.path ? `@${pick.path}` : { id: TEXTBOX, text: pick.text });

// What the sheet shows, for anyone reading the file (DESIGN.md: "full" version, so full
// objects). Each move or feature gets a `chosen` list: its own choices (Tools and
// Techniques' cross-off, Practitioner's effects, Combat Magic's picks). Ignored when loading.
const computedFor = (hunter) => {
    const state = hunterState(hunter);
    const withChosen = ({ node, path }) => {
        const chosen = [...picksUnder(state, path), ...state.crosses
            .filter((c) => c.path.startsWith(`${path}.`))].map(storedPick);
        return chosen.length ? { ...node, chosen } : node;
    };
    return {
        ratings: state.ratings,
        moves: state.moves.map(withChosen),
        gear: [...state.gear.map((item) => item.node), ...hunter.extra_gear],
        features: state.features.map(withChosen),
    };
};

// The hunter as saved: its own data, `updated`, the computed view, then the playbook copy
// last (it's most of the file).
const toSaved = (hunter) => {
    // eslint-disable-next-line no-unused-vars
    const { playbook, updated, ...own } = JSON.parse(JSON.stringify(hunter));
    const saved = {};
    for (const [key, value] of Object.entries(own)) {
        saved[key] = value;
        if (key === 'created') {
            saved.updated = new Date().toISOString();
        }
    }
    saved.computed = computedFor(hunter);
    saved.playbook = playbook;
    return saved;
};

const saveHunter = (hunter) => {
    localStorage.setItem(PREFIX + hunter.uid, JSON.stringify(toSaved(hunter)));
};

// Null if there's no such hunter, or it was saved in an older format.
const loadHunter = (uid) => {
    const json = localStorage.getItem(PREFIX + uid);
    return json ? Hunter.fromJSON(JSON.parse(json)) : null;
};

// Every saved hunter: { uid, hunter }, or { uid, outdated: true, label } for an older format.
// Migrating old saves isn't MVP (plan/Roadmap.md); they can only be deleted.
const listHunters = () => {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(PREFIX)) {
            continue;
        }
        const uid = key.slice(PREFIX.length);
        const hunter = loadHunter(uid);
        if (hunter) {
            entries.push({ uid, hunter });
        } else {
            const data = JSON.parse(localStorage.getItem(key));
            const label = hunterTitle(data?.name, data?.playbook_name);
            entries.push({ uid, outdated: true, label });
        }
    }
    return entries;
};

const deleteHunter = (uid) => {
    localStorage.removeItem(PREFIX + uid);
};

const exportHunter = (hunter) => {
    const blob = new Blob([JSON.stringify(toSaved(hunter), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${hunter.toString()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
};

// Returns the imported hunter, or null if the user declined to overwrite.
// Throws if the file isn't a hunter.
const importHunter = async (file) => {
    const data = JSON.parse(await file.text());
    if (!data.uid || !data.playbook) {
        throw new Error(`${file.name} is not a hunter file`);
    }
    const hunter = Hunter.fromJSON(data);
    if (!hunter) {
        throw new Error(`${file.name} was saved by an older version of the app`);
    }
    const existing = loadHunter(hunter.uid);
    if (existing && !confirm(`Overwrite the saved copy of ${existing.toString()}?`)) {
        return null;
    }
    saveHunter(hunter);
    return hunter;
};

export { toSaved, saveHunter, loadHunter, listHunters, deleteHunter, exportHunter, importHunter };
