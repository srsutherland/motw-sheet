import { Hunter } from '@/Hunter';

// Each hunter is stored under its own key, so saving one doesn't rewrite the rest.
const PREFIX = 'motw-sheet.hunter.';

const saveHunter = (hunter) => {
    localStorage.setItem(PREFIX + hunter.uid, JSON.stringify(hunter));
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
            const name = data?.name || '<Nameless>';
            const label = `${name} the ${data?.playbook_name || '<Unknown Playbook>'}`;
            entries.push({ uid, outdated: true, label });
        }
    }
    return entries;
};

const deleteHunter = (uid) => {
    localStorage.removeItem(PREFIX + uid);
};

const exportHunter = (hunter) => {
    const blob = new Blob([JSON.stringify(hunter, null, 2)], { type: 'application/json' });
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

export { saveHunter, loadHunter, listHunters, deleteHunter, exportHunter, importHunter };
