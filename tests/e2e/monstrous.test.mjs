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
await box(breed, 'Originally human').check();
check('origin: one only', await box(breed, 'Always this way').isDisabled(), true);
await breed.locator('input.textbox').nth(1).fill('Evil until 1890');
await breed.locator('input.textbox').nth(1).blur();
check('edit: suggestions (on_edit details)', await breed.locator('.move-details li').count(), 7);
check('edit: description extended (on_edit)', (await breed.locator('.md').first().innerText()).includes('listed below'), true);

// Curses: Pure Drive has its own pick of an emotion
const curses = section('Curses');
check('edit: Pure Drive lists its emotions', (await curses.innerText()).includes('Pick from: hunger'), true);
await box(curses, 'Pure Drive').check();
const drive = curses.locator('li', { has: box(page, 'Pure Drive') }).locator('.nested');
await box(drive, 'hunger').check();
check('one emotion', await box(drive, 'hate').isDisabled(), true);

// Natural attacks: a base and an extra, or two bases
const attacks = section('Natural Attacks');
await box(attacks, 'Add +1 harm').check();
check('at most one extra', await box(attacks, 'Add ignore-armour').isDisabled(), true);
check('base still needed', await attacks.locator('.status').innerText(), 'Pick 2 (1 left) · at least 1 from Bases');
await box(attacks, 'teeth').check();

// Moves: Something Borrowed picks a move from another playbook
const moves = section('Moves');
await box(moves, 'Something Borrowed').check();
const borrowed = moves.locator('li', { has: box(page, 'Something Borrowed') }).locator('.nested');
await box(borrowed, 'Preparedness').check();
await box(moves, 'Immortal').check();

// Gear is optional
check('optional gear', [await section('Starting Gear').locator('.status').innerText(), await section('Starting Gear').locator('.status.unmet').count()], ['Pick up to 1', 0]);

await page.locator('#edit-ratings input[type=radio]').first().check();
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(/\?view=/);

const feature = (name) => page.locator('.show-feature', { has: page.locator(`h2:text-is("${name}")`) });
check('view: breed', await feature('Monster Breed').locator('li').allInnerTexts(), ['Originally human, transformed somehow', 'Evil until 1890']);
check('view: breed groups', await feature('Monster Breed').locator('.group-name').allInnerTexts(), ['Origin:', 'Alignment:']);
const curseView = await feature('Curses').locator('li').innerText();
check('view: curse with its emotion, shorter text (on_view)', [curseView.endsWith('(hunger)'), curseView.includes('Pick from')], [true, false]);
check('view: breed without the suggestions (on_edit only)', [await feature('Monster Breed').locator('.move-details').count(), (await feature('Monster Breed').locator('.description').innerText()).includes('listed below')], [0, false]);
check('view: natural attacks', (await feature('Natural Attacks').locator('li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()), ['teeth (3-harm intimate)', 'Add +1 harm to a base']);
check('view: moves', (await page.locator('.show-move .move-name').allInnerTexts()).map((t) => t.trim()), ['Something Borrowed:', 'Immortal:', 'Preparedness:']);
check('view: no gear', await page.locator('.show-gear li').count(), 0);
check('view: ratings', await page.locator('.stat-bubble').allInnerTexts(), ['-1', '-1', '0', '2', '3']);

check('console errors', errors, []);
await browser.close();
finish();
