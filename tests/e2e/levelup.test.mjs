import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

const dialog = page.locator('dialog');
const ratings = () => page.locator('.stat-bubble').allInnerTexts();
const level = async () => (await page.locator('.show-experience em').innerText()).trim();
const xp = () => page.locator('.show-experience .track').innerText()
    .then((t) => (t.match(/■/g) || []).length);
const fillXp = async () => {
    for (let i = 0; i < 5; i++) await page.locator('.show-experience button.plus').click();
};
const levelUp = async () => {
    await fillXp();
    await page.getByRole('button', { name: 'Level Up' }).click();
};
const advancement = () => page.getByRole('button', { name: /^Advancement/ });
const option = (text) => dialog.getByRole('button', { name: text, exact: true });
const take = async (text) => {
    await advancement().click();
    await option(text).click();
    await dialog.getByRole('button', { name: 'Take it' }).click();
};
const box = (name) => dialog.getByRole('checkbox', { name: new RegExp(`^${name}\\b`) });

await page.goto(BASE);
await page.getByRole('button', { name: 'New Playbook' }).click();
await page.locator('.select-button').first().click();
await page.locator('#edit-ratings input[type=radio]').first().check(); // Charm-1 Cool+1 Sharp+1 Tough=0 Weird+2
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(/\?view=/);
check('start', [await ratings(), await level(), await advancement().count()], [['-1', '1', '1', '0', '2'], 'Level 0', 0]);

// Level Up: next to the + button at 5 XP; no dialog
check('no Level Up below 5 XP', await page.getByRole('button', { name: 'Level Up' }).count(), 0);
await levelUp();
check('leveled up', [await level(), await xp(), await dialog.isVisible()], ['Level 1', 0, false]);
check('advancement offered', (await advancement().innerText()).trim(), 'Advancement (+1)');

// The dialog: cancel changes nothing
await advancement().click();
check('advanced locked', (await dialog.locator('section', { has: page.locator('h3:text-is("Advanced Improvements")') }).innerText()).includes('Not unlocked yet'), true);
check('other playbook move blocked', await option('Take a move from another playbook').first().isDisabled(), true);
await option('Take another Spell-slinger move').first().click();
await dialog.getByRole('button', { name: 'Back' }).click();
await dialog.getByRole('button', { name: 'Cancel' }).click();
check('cancel changes nothing', [await dialog.isVisible(), await level(), (await advancement().innerText()).trim(), await page.locator('.show-improvements li').count()], [false, 'Level 1', 'Advancement (+1)', 0]);

// A fixed effect
await take('Get +1 Weird, max +3');
check('+1 weird', [await ratings(), await advancement().count()], [['-1', '1', '1', '0', '3'], 0]);

// A choice, with a nested choice; unfinished choices are allowed
await levelUp();
await advancement().click();
check('taken improvement blocked', await option('Get +1 Weird, max +3').isDisabled(), true);
await option('Take another Spell-slinger move').first().click();
check('unfinished choices allowed, with a note', [await dialog.getByRole('button', { name: 'Take it' }).isDisabled(), (await dialog.innerText()).includes('finish them later')], [false, true]);
await box('Practitioner').check();
await box('Heal').check();
await box('Summon').check();
await dialog.getByRole('button', { name: 'Take it' }).click();
const practitioner = page.locator('.show-move', { has: page.locator('.move-name:text-is("Practitioner:")') });
check('move from improvement, with its choices', (await practitioner.locator('.choices li').allInnerTexts()).map((t) => t.split(' ')[0]), ['Heal', 'Summon']);

// Up to level 5
for (const text of ['Get +1 Cool, max +2', 'Get +1 Sharp, max +2', 'Get +1 Tough, max +2']) {
    await levelUp();
    await take(text);
}
check('level 5', [await ratings(), await level()], [['-1', '2', '2', '1', '3'], 'Level 5']);

// Advanced: any rating (weird already at +3)
await levelUp();
await advancement().click();
await option('Get +1 to any rating, max +3').click();
check('weird at max', await box('Weird').isDisabled(), true);
await box('Charm').check();
await dialog.getByRole('button', { name: 'Take it' }).click();
check('+1 charm', [await ratings(), await level()], [['0', '2', '2', '1', '3'], 'Level 6']);

// Advanced: erase a used luck mark
for (let i = 0; i < 2; i++) await page.locator('.show-luck button.plus').click();
await levelUp();
await take('Erase one used Luck mark from your playbook');
check('luck mark erased', await page.locator('.show-luck .track').innerText().then((t) => (t.match(/■/g) || []).length), 1);

// Remove an improvement on the edit page; take it again through Advancement
await page.getByTitle('Edit').click();
const improvements = page.locator('#improvements .improvement');
check('edit page lists improvements', await improvements.count(), 7);
await improvements.filter({ hasText: 'Get +1 Sharp' }).getByTitle(/^Remove/).click();
check('advancement on the edit page', (await page.locator('#improvements').getByRole('button', { name: /^Advancement/ }).innerText()).trim(), 'Advancement (+1)');
await page.getByRole('button', { name: 'Save' }).click();
check('sharp back down', (await ratings())[2], '1');
await take('Get +1 Sharp, max +2');
check('re-taken without leveling', [(await ratings())[2], await level(), await advancement().count()], ['2', 'Level 7', 0]);

// Advanced: mark basic moves as advanced (they're already yours)
await levelUp();
await advancement().click();
await option('Mark two of the basic moves as advanced').click();
check('basic moves selectable', await box('Kick Some Ass').isDisabled(), false);
await box('Kick Some Ass').check();
await box('Use Magic').check();
await dialog.getByRole('button', { name: 'Take it' }).click();
const advancedMoves = () => page.locator('.basic-moves li', { hasText: '(advanced)' }).count();
check('advanced on the ratings table', await advancedMoves(), 2);
check('not added as moves', await page.locator('.show-move .move-name', { hasText: 'Kick Some Ass' }).count(), 0);

// Level down: - at 0 XP, confirmed; the newest improvement is disabled, choices kept
const confirms = [];
page.on('dialog', (d) => { confirms.push(d.message()); d.accept(); });
await page.locator('.show-experience button.minus').click();
check('level down asks first', confirms[0]?.startsWith('Level down to level 7?') && confirms[0].includes('1 improvement will be disabled'), true);
check('leveled down', [await level(), await xp()], ['Level 7', 4]);
check('disabled note', (await page.locator('.show-experience .disabled-note').innerText()).trim(), '1 improvement disabled');
check('its effect is gone', await advancedMoves(), 0);
check('marked disabled, choices kept', (await page.locator('.show-improvements li.disabled').innerText()).trim(), 'Mark two of the basic moves as advanced: Kick Some Ass, Use Magic (disabled: above your current level)');

// Level back up: re-enabled
await page.locator('.show-experience button.plus').click();
await page.getByRole('button', { name: 'Level Up' }).click();
check('re-enabled', [await level(), await advancedMoves(), await page.locator('.show-improvements li.disabled').count()], ['Level 8', 2, 0]);

// Levels can be banked
await levelUp();
await levelUp();
check('two unspent', (await advancement().innerText()).trim(), 'Advancement (+2)');

// Improvements at the bottom of the sheet, with what was chosen
const taken = await page.locator('.show-improvements li').allInnerTexts();
check('improvements list', taken.length, 8);
check('improvement with its choice', taken.find((t) => t.startsWith('Take another Spell-slinger move')), 'Take another Spell-slinger move: Practitioner');
check('any rating shows the rating', taken.find((t) => t.startsWith('Get +1 to any rating')), 'Get +1 to any rating, max +3: Charm');
check('improvements are last', await page.locator('main > :last-child').getAttribute('class'), 'show-improvements');

await page.reload();
check('after reload', [await ratings(), await level(), await page.locator('.show-improvements li').count(), (await advancement().innerText()).trim()], [['0', '2', '2', '1', '3'], 'Level 10', 8, 'Advancement (+2)']);

check('console errors', errors, []);
await browser.close();
finish();
