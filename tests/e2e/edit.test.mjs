import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

const section = (legend) => page.locator('fieldset', { has: page.locator(`legend:text-is("${legend}")`) });
const box = (scope, name) => scope.getByRole('checkbox', { name: new RegExp(`^${name}\\b`) });

await page.goto(BASE);
await page.getByRole('button', { name: 'New Playbook' }).click();
await page.locator('.select-button').first().click();
await page.waitForURL(/\?edit=/);
const id = new URL(page.url()).searchParams.get('edit');

await page.locator('.hunter-name input').fill('Alice');
await page.locator('.pronouns input').fill('they/them');

// Combat Magic: 3 picks, at least 1 base
const cm = section('Combat Magic');
for (const name of ['Fire', 'Earth', 'Necromantic']) await box(cm, name).check();
check('base warning shown', await cm.locator('.status').innerText(), 'Pick 3 · at least 1 from Bases');
check('4th pick blocked', await box(cm, 'Blast').isDisabled(), true);
await box(cm, 'Necromantic').uncheck();
await box(cm, 'Blast').check();
check('warning cleared', await cm.locator('.status').innerText(), 'Pick 3');

// Tools and Techniques: granted, cross off 1
const moves = section('Moves');
const tt = moves.locator('.granted');
check('T&T granted', (await tt.locator('p').first().innerText()).startsWith('Tools and Techniques'), true);
await box(tt, 'Gestures').check();
check('cross limit', await box(tt, 'Foci').isDisabled(), true);
check('T&T offered as "already have"', await box(moves, 'Tools and Techniques').isDisabled(), true);

// Moves: pick 3, with nested choices
await box(moves, 'Practitioner').check();
const prac = moves.locator('li', { has: box(page, 'Practitioner') }).locator('.nested');
await box(prac, 'Heal').check();
await box(prac, 'Banish').check();
check('practitioner limit', await box(prac, 'Summon').isDisabled(), true);
await box(moves, 'Arcane Reputation').check();
const rep = moves.locator('li', { has: box(page, 'Arcane Reputation') }).locator('.nested');
check('three textboxes', await rep.locator('input.textbox').count(), 3);
await rep.locator('input.textbox').first().fill('The White Council');
await rep.locator('input.textbox').first().blur();
await box(moves, 'Third Eye').check();
check('moves full', await box(moves, 'Shield Spell').isDisabled(), true);
await page.getByLabel('Bend the rules').check();
check('bend the rules lifts limit', await box(moves, 'Shield Spell').isDisabled(), false);
await page.getByLabel('Bend the rules').uncheck();

// Gear
await box(section('Starting Gear'), 'Ritual knife').check();
const other = section('Other Gear');
await other.getByRole('button', { name: 'Add gear' }).click();
await other.locator('input[placeholder="name"]').fill('Flashlight');
await other.locator('input[placeholder^="tags"]').fill('utility');
await other.locator('input[placeholder^="tags"]').blur();

// Look, ratings, history
const look = section('Look');
await look.getByLabel('rumpled').check();
await look.locator('input.textbox').nth(1).fill('glowing');
await look.locator('input.textbox').nth(1).blur();
await page.locator('#edit-ratings input[type=radio]').first().check();
check('current ratings shown', await page.locator('.current-ratings').innerText(), 'Charm-1, Cool+1, Sharp+1, Tough=0, Weird+2');
const history = section('History');
await history.getByRole('button', { name: 'Add a hunter' }).click();
await history.locator('input[placeholder="other hunter\'s name"]').fill('Bob');
await history.locator('select').selectOption({ index: 3 });
check('history prefill', await history.locator('textarea').first().inputValue(), 'Mentor from another life. Ask them what they taught you.');
await history.locator('textarea').first().fill('Mentor from another life. Taught me to fight.');

// Persisted across a reload
await page.reload();
check('reload: combat magic', await Promise.all(['Blast', 'Fire', 'Earth', 'Necromantic'].map((n) => box(section('Combat Magic'), n).isChecked())), [true, true, true, false]);
check('reload: crossed', await box(section('Moves').locator('.granted'), 'Gestures').isChecked(), true);
check('reload: arcane text', await section('Moves').locator('li', { has: box(page, 'Arcane Reputation') }).locator('input.textbox').first().inputValue(), 'The White Council');
check('reload: look', [await section('Look').getByLabel('rumpled').isChecked(), await section('Look').locator('input.textbox').nth(1).inputValue()], [true, 'glowing']);
check('reload: history', await section('History').locator('textarea').first().inputValue(), 'Mentor from another life. Taught me to fight.');
check('reload: pronouns', await page.locator('.pronouns input').inputValue(), 'they/them');

// Save -> view page
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(new RegExp(`view=${id}`));
check('view: moves', (await page.locator('.show-move .move-name').allInnerTexts()).map((t) => t.trim()), ['Tools and Techniques:', 'Practitioner:', 'Arcane Reputation:', 'Third Eye:']);
check('view: gear', (await page.locator('.show-gear li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()), ['Ritual knife (1-harm hand)', 'Flashlight (utility)']);
check('view: ratings', await page.locator('.stat-bubble').allInnerTexts(), ['-1', '1', '1', '0', '2']);
check('view: protect someone listed', (await page.locator('.basic-moves').allInnerTexts()).join('|').includes('Protect Someone'), true);

check('view: title', (await page.locator('h1.hunter-name').innerText()).replace(/[🖉⭳]/gu, '').trim(), 'Alice the Spell-Slinger');
check('view: pronouns and look', await page.locator('p.subtitle').innerText(), '(they/them) rumpled clothes, glowing eyes');
check('view: luck special', (await page.locator('.show-luck .special').innerText()).startsWith('Spell-slinger Special:'), true);
const feature = page.locator('.show-feature', { has: page.locator('h2:text-is("Combat Magic")') });
check('view: combat magic groups', (await feature.locator('.group-name').allInnerTexts()), ['Bases:', 'Effects:']);
check('view: combat magic picks', (await feature.locator('li strong').allInnerTexts()), ['Blast', 'Fire', 'Earth']);
check('view: feature description', (await feature.locator('.description').innerText()).startsWith('You have a few attack spells'), true);
const order = await page.locator('main > section').evaluateAll((els) => els.map((el) => el.className.split(' ')[0]));
check('view: gear before features and moves', order.indexOf('show-gear') < order.indexOf('show-feature') && order.indexOf('show-feature') < order.indexOf('show-moves'), true);
const moveOf = (name) => page.locator('.show-move', { has: page.locator(`.move-name:text-is("${name}:")`) });
check('view: crossed T&T', await moveOf('Tools and Techniques').locator('li.crossed strong').allInnerTexts(), ['Gestures']);
check('view: practitioner effects', (await moveOf('Practitioner').locator('.choices li').allInnerTexts()).map((t) => t.split(' ')[0]), ['Heal', 'Banish']);
check('view: arcane reputation', await moveOf('Arcane Reputation').locator('.choices li').allInnerTexts(), ['The White Council']);
check('view: details', await moveOf('Third Eye').locator('ul').count(), 0);
check('view: history', (await page.locator('.show-history li').innerText()).replace(/\s+/g, ' '), 'Bob: Mentor from another life. Taught me to fight.');
await page.locator('header a').click();
check('home list title', (await page.locator('#hunters li a').first().innerText()).trim(), '🔮 Alice the Spell-Slinger');

check('console errors', errors, []);
await browser.close();
finish();
