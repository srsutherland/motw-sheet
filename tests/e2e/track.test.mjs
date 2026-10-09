import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

// count filled boxes in a section's track
const filled = (section) =>
    page.locator(`${section} .track`).innerText().then((t) => (t.match(/■/g) || []).length);
const unstable = () => page.locator('.show-harm .toggle').innerText().then((t) => t.includes('■'));
const click = (section, which, times = 1) =>
    (async () => { for (let i = 0; i < times; i++) await page.locator(`${section} button.${which}`).click(); })();

const newHunter = async (name) => {
    await page.getByRole('button', { name: 'New Playbook' }).click();
    await page.locator('.select-button').first().click();
    await page.locator('.hunter-name input').fill(name);
    await page.locator('#edit-ratings input[type=radio]').first().check();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL(/\?view=/);
    return new URL(page.url()).searchParams.get('view');
};

await page.goto(BASE);
const id1 = await newHunter('Alice');
check('show page URL has id', !!id1, true);

// Luck
await click('.show-luck', 'plus', 2);
check('luck +2', await filled('.show-luck'), 2);
await click('.show-luck', 'minus');
check('luck -1', await filled('.show-luck'), 1);
await click('.show-luck', 'minus', 3);
check('luck clamps at 0', await filled('.show-luck'), 0);

// Harm + unstable
await click('.show-harm', 'plus', 3);
check('harm 3, not unstable', [await filled('.show-harm'), await unstable()], [3, false]);
await click('.show-harm', 'plus');
check('harm 4 marks unstable', [await filled('.show-harm'), await unstable()], [4, true]);
check('divider drawn', (await page.locator('.show-harm .track').innerText()).includes('|'), true);
await click('.show-harm', 'minus');
check('healing keeps unstable', [await filled('.show-harm'), await unstable()], [3, true]);
await page.locator('.show-harm .toggle').click();
check('click unmarks unstable', await unstable(), false);
await click('.show-harm', 'minus');
check('harm down stays stable', [await filled('.show-harm'), await unstable()], [2, false]);
await page.locator('.show-harm .toggle').click();
check('click marks unstable', await unstable(), true);
await page.locator('.show-harm .toggle').click();
await click('.show-harm', 'plus', 10);
check('harm clamps at max, re-marks unstable', [await filled('.show-harm'), await unstable()], [7, true]);

// Experience
await click('.show-experience', 'plus', 5);
check('xp 5', await filled('.show-experience'), 5);
await page.getByRole('button', { name: 'Level Up' }).click();
check('level up resets xp', [await filled('.show-experience'), await page.locator('.show-experience em').innerText()], [0, 'Level 1']);

// Second hunter, then back to the first via the browser history
await page.locator('header a').click();
const id2 = await newHunter('Bob');
check('second hunter has its own id', id2 !== id1, true);
check('Bob starts at luck 0', await filled('.show-luck'), 0);
while (!page.url().includes(`view=${id1}`)) await page.goBack();
check('back shows Alice', (await page.locator('h1.hunter-name').innerText()).includes('Alice'), true);
check('Alice kept her harm', await filled('.show-harm'), 7);
await click('.show-luck', 'plus');

// Persistence across reload
await page.reload();
check('after reload: Alice luck/harm/unstable', [await filled('.show-luck'), await filled('.show-harm'), await unstable()], [1, 7, true]);
await page.goto(`${BASE}?view=${id2}`);
check('Bob unaffected by Alice edits', [await filled('.show-luck'), await filled('.show-harm')], [0, 0]);

check('console errors', errors, []);
await browser.close();
finish();
