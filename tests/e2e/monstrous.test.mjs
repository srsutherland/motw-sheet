import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

const section = (legend) => page.locator('fieldset', { has: page.locator(`legend:text-is("${legend}")`) });
const box = (scope, name) => scope.getByRole('checkbox', { name: new RegExp(`^${name.replace(/[()+]/g, '\\$&')}`) });

await page.goto(BASE);
await page.getByRole('button', { name: 'New Playbook' }).click();
await page.locator('#the_monstrous').click();
await page.waitForURL(/\?edit=/);
await page.locator('.hunter-name input').fill('Vlad');

// Monster Breed: two pick-1 sub-lists of plain strings, each with a write-your-own
const breed = section('Monster Breed');
check('breed sub-lists', await breed.locator('.sub-list-name').allInnerTexts(), ['Origin:', 'Alignment:']);
check('sub-list description', (await breed.innerText()).includes('Now decide if you were always fighting to be good'), true);
check('write-your-own has a checkbox among options', await breed.locator('li', { has: page.locator('input.textbox') }).first().locator('input[type=checkbox]').count(), 1);
await box(breed, 'Originally human').check();
check('origin: one only', await box(breed, 'Always this way').isDisabled(), true);
await breed.locator('input.textbox').nth(1).fill('Evil until 1890');
await breed.locator('input.textbox').nth(1).blur();
check('edit: suggestions (on_edit details)', await breed.locator('.move-details li').count(), 7);
check('edit: description extended (on_edit)', (await breed.locator('.md').first().innerText()).includes('listed below'), true);

// Curse: Pure Drive has its own pick of an emotion
const curse = section('Curse');
check('edit: Pure Drive lists its emotions', (await curse.innerText()).includes('Pick from: hunger'), true);
await box(curse, 'Pure Drive').check();
const drive = curse.locator('li', { has: box(page, 'Pure Drive') }).locator('.nested');
await box(drive, 'hunger').check();
check('one emotion', await box(drive, 'hate').isDisabled(), true);

// Natural attacks: a base and an extra, or two bases
const attacks = section('Natural Attacks');
await box(attacks, 'Add +1 harm').check();
check('at most one extra', await box(attacks, 'Add ignore-armour').isDisabled(), true);
check('base still needed', await attacks.locator('.status').first().innerText(), 'Pick 2 (1 left) · at least 1 from Bases');
const extra = attacks.locator('li', { has: box(page, 'Add +1 harm') }).locator('.nested');
check('attach: nothing to attach to yet', await extra.locator('input[type=checkbox]').count(), 0);
await box(attacks, 'teeth').check();
check('attach: offers your bases only', await extra.locator('label').allInnerTexts(), ['teeth (3-harm intimate)']);
await box(extra, 'teeth').check();

// Moves: Something Borrowed picks a move from another playbook
const moves = section('Moves');
await box(moves, 'Something Borrowed').check();
const borrowed = moves.locator('li', { has: box(page, 'Something Borrowed') }).locator('.nested');
await box(borrowed, 'Preparedness').check();
await box(moves, 'Immortal').check();

// Gear is optional
check('optional gear', [await section('Starting Gear').locator('.status').innerText(), await section('Starting Gear').locator('.status.unmet').count()], ['Pick up to 1', 0]);

const look = section('Look');
check('look: format first', (await look.locator('.look-list').nth(1).innerText()).startsWith('___ aura:'), true);
await look.locator('.look-list').nth(1).locator('input.textbox').fill('smoky');
await look.locator('.look-list').nth(1).locator('input.textbox').blur();
check('look: write-your-own radio checked', await look.locator('.look-list').nth(1).locator('input[type=radio]').last().isChecked(), true);
await look.getByLabel('sinister').check();
await look.locator('.look-list').nth(1).locator('input[type=radio]').last().check();
check('look: back to what was written', await look.locator('.look-list').nth(1).locator('input[type=radio]').last().isChecked(), true);
await page.locator('#edit-ratings input[type=radio]').first().check();
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(/\?view=/);

const feature = (name) => page.locator('.view-feature', { has: page.locator(`h2:text-is("${name}")`) });
check('view: breed', await feature('Monster Breed').locator('li').allInnerTexts(), ['Originally human, transformed somehow', 'Evil until 1890']);
check('view: breed groups', await feature('Monster Breed').locator('.group-name').allInnerTexts(), ['Origin:', 'Alignment:']);
const curseView = await feature('Curse').locator('li').innerText();
check('view: curse with its emotion, shorter text (on_view)', [curseView.endsWith('(hunger)'), curseView.includes('Pick from')], [true, false]);
check('view: breed without the suggestions (on_edit only)', [await feature('Monster Breed').locator('.move-details').count(), (await feature('Monster Breed').locator('.description').innerText()).includes('listed below')], [0, false]);
check('view: natural attacks groups', await feature('Natural Attacks').locator('.group-name').allInnerTexts(), ['Bases:']);
check('view: natural attacks', (await feature('Natural Attacks').locator('li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()), ['teeth (3-harm intimate) (Add +1 harm to a base)']);
check('view: moves', (await page.locator('.view-move .move-name').allInnerTexts()).map((t) => t.trim()), ['Something Borrowed:', 'Immortal:', 'Preparedness:']);
check('view: no gear', await page.locator('.view-gear li').count(), 0);
check('view: ratings', await page.locator('.stat-bubble').allInnerTexts(), ['-1', '-1', '0', '2', '3']);

check('console errors', errors, []);
await browser.close();
finish();
