import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

const section = (legend) => page.locator('fieldset', { has: page.locator(`legend:text-is("${legend}")`) });
const box = (scope, name) => scope.getByRole('checkbox', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) });

await page.goto(BASE);
await page.getByRole('button', { name: 'New Playbook' }).click();
await page.locator('#the_expert').click();
await page.waitForURL(/\?edit=/);
await page.locator('.hunter-name input').fill('Bea');

// Haven: a post-moves feature, pick 3
const haven = section('Haven');
for (const name of ['Lore Library', 'Armory', 'Panic Room']) await box(haven, name).check();
check('haven full', await box(haven, 'Oubliette').isDisabled(), true);

// Moves: none granted, pick 2; Dark Past's questions shown with it
const moves = section('Moves');
check('no granted moves', await moves.locator('.granted').count(), 0);
const darkPastEdit = moves.locator('li', { has: box(page, 'Dark Past') }).locator('.move-details');
check('Dark Past questions on the edit page, bulleted', [await darkPastEdit.locator('li').count(), await darkPastEdit.evaluate((el) => getComputedStyle(el).listStyleType) !== 'none'], [4, true]);
await box(moves, 'Dark Past').check();
await box(moves, 'Preparedness').check();
check('moves full', await box(moves, 'Precise Strike').isDisabled(), true);
check('a full option greys out with its details', await moves.locator('li.disabled', { has: box(page, 'Precise Strike') }).count(), 1);

// Gear: pick 3
const gear = section('Starting Gear');
for (const name of ['Silver sword', 'Magnum', 'Juju bag']) await box(gear, name).check();
check('gear full', await box(gear, 'Shotgun').isDisabled(), true);

const look = section('Look');
await look.getByLabel('scarred').check();
await look.getByLabel('tailored').check();
await page.locator('#edit-ratings input[type=radio]').first().check();

await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(/\?view=/);
check('view: title', (await page.locator('h1.hunter-name').innerText()).replace(/[🖉⭳]/gu, '').trim(), 'Bea the Expert');
check('view: look', await page.locator('p.subtitle').innerText(), 'scarred face, tailored clothes');
check('view: ratings', await page.locator('.stat-bubble').allInnerTexts(), ['-1', '1', '2', '1', '0']);
check('view: moves', (await page.locator('.view-move .move-name').allInnerTexts()).map((t) => t.trim()), ['Dark Past:', 'Preparedness:']);
const darkPast = page.locator('.view-move', { has: page.locator('.move-name:text-is("Dark Past:")') });
check('view: Dark Past questions', await darkPast.locator('.move-details li').count(), 4);
check('view: gear', (await page.locator('.view-gear li').allInnerTexts()).map((t) => t.split(' (')[0].trim()), ['Silver sword', 'Magnum', 'Juju bag']);
const havenView = page.locator('.view-feature', { has: page.locator('h2:text-is("Haven")') });
check('view: haven picks', await havenView.locator('li > strong').allInnerTexts(), ['Lore Library', 'Armory', 'Panic Room']);
const order = await page.locator('main > section').evaluateAll((els) => els.map((el) => el.className.split(' ')[0]));
check('view: haven after moves', order.indexOf('view-moves') < order.indexOf('view-feature'), true);
await page.locator('.view-luck .popup-trigger').hover();
check('view: luck special', (await page.locator('.view-luck .popup').innerText()).startsWith('Expert special:'), true);

check('console errors', errors, []);
await browser.close();
finish();
