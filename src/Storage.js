import { Hunter } from '@/Hunter';

// Each hunter is stored under its own key, so saving one doesn't rewrite the rest.
const PREFIX = 'motw-sheet.hunter.';

const saveHunter = (hunter) => {
    localStorage.setItem(PREFIX + hunter.uid, JSON.stringify(hunter));
};

const loadHunter = (uid) => {
    const json = localStorage.getItem(PREFIX + uid);
    return json ? Hunter.fromJSON(JSON.parse(json)) : null;
};

const listHunters = () => {
    const hunters = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(PREFIX)) {
            hunters.push(loadHunter(key.slice(PREFIX.length)));
        }
    }
    return hunters;
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
    const existing = loadHunter(hunter.uid);
    if (existing && !confirm(`Overwrite the saved copy of ${existing.toString()}?`)) {
        return null;
    }
    saveHunter(hunter);
    return hunter;
};

export { saveHunter, loadHunter, listHunters, deleteHunter, exportHunter, importHunter };
