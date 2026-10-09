import fs from 'node:fs';
import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();

// Make a hunter and export it
const errors = [];
const a = await watchedPage(browser, errors);
await a.goto(BASE);
await a.getByRole('button', { name: 'New Playbook' }).click();
await a.locator('.select-button').first().click();
await a.locator('.hunter-name input').fill('Exported');
await a.locator('#edit-ratings input[type=radio]').nth(2).check();
await a.getByRole('checkbox', { name: /^Third Eye\b/ }).check();
await a.getByRole('button', { name: 'Save' }).click();
const [download] = await Promise.all([a.waitForEvent('download'), a.getByTitle('Export to file').click()]);
check('file name', download.suggestedFilename(), 'Exported the Spell-Slinger.json');
const file = await download.path();
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
check('exported format', [data.schema_version, data.name, data.playbook.id, data.playbook_updated], ['0.1.2026.10.09.1', 'Exported', 'the_spellslinger', '2026-10-07']);
check('exported choices', data.getting_started.choose[1], { from: '@moves', choices: ['@third_eye'] });
check('exported computed', [data.computed.ratings, data.computed.moves.map((m) => m.name), Object.keys(data).at(-1)], [{ charm: -1, cool: 0, sharp: 2, tough: -1, weird: 2 }, ['Tools and Techniques', 'Third Eye'], 'playbook']);

// Import into a fresh browser (empty localStorage)
const b = await watchedPage(await browser.newContext(), errors);
await b.goto(BASE);
await b.locator('input[type=file]').setInputFiles(file);
await b.waitForURL(/\?view=/);
check('imported view', [(await b.locator('h1.hunter-name').innerText()).includes('Exported'), await b.locator('.stat-bubble').allInnerTexts()], [true, ['-1', '0', '2', '-1', '2']]);
check('imported moves', (await b.locator('.show-move .move-name').allInnerTexts()).map((t) => t.trim()), ['Tools and Techniques:', 'Third Eye:']);

// The converted sample hunter loads
await b.locator('header a').click();
await b.locator('input[type=file]').setInputFiles('samples/Dave Johnson the Spell-Slinger.json');
await b.waitForURL(/view=39e87fd3/);
check('sample hunter', [(await b.locator('h1.hunter-name').innerText()).includes('Dave Johnson the Spell-Slinger'), await b.locator('.stat-bubble').allInnerTexts()], [true, ['-1', '2', '2', '0', '3']]);

// An old-format file is refused, and an old save is listed as old
const old = file + '.old.json';
fs.writeFileSync(old, JSON.stringify({ uid: 'old-1', playbook: {}, name: 'Ancient', playbook_name: 'The Spell-Slinger' }));
await b.locator('header a').click();
const dialogs = [];
b.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });
await b.locator('input[type=file]').setInputFiles(old);
await b.waitForTimeout(300);
check('old import refused', dialogs[0]?.includes('older version'), true);
await b.evaluate(() => localStorage.setItem('motw-sheet.hunter.old-2', JSON.stringify({ uid: 'old-2', name: 'Ancient', playbook_name: 'The Spell-Slinger' })));
await b.reload();
check('old save listed', (await b.locator('#hunters li').allInnerTexts()).some((t) => t.includes('Ancient the Spell-Slinger (old format)')), true);
await b.goto(`${BASE}?view=old-2`);
check('old save not opened', new URL(b.url()).search, '');

// (opening the old save by URL logs "No saved hunter" on purpose)
check('page errors', errors.filter((e) => !e.startsWith('No saved hunter')), []);
await browser.close();
finish();
