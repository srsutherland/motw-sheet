import { check, finish } from '../check.mjs';
import { BASE, launch, watchedPage } from './browser.mjs';

const browser = await launch();
const errors = [];
const page = await watchedPage(browser, errors);

const dialog = page.locator('dialog');
const ratings = () => page.locator('.stat-bubble').allInnerTexts();
const level = async () => (await page.locator('.show-experience em').innerText()).trim();
const fillXp = async () => { for (let i = 0; i < 5; i++) await page.locator('.show-experience button.plus').click(); };
const option = (text) => dialog.getByRole('button', { name: text, exact: true });
const levelUpWith = async (text) => {
    await fillXp();
    await page.getByRole('button', { name: 'Level up' }).click();
    await option(text).click();
    await dialog.getByRole('button', { name: 'Take it' }).click();
};

await page.goto(BASE);
await page.getByRole('button', { name: 'New Playbook' }).click();
await page.locator('.select-button').first().click();
await page.locator('#edit-ratings input[type=radio]').first().check(); // Charm-1 Cool+1 Sharp+1 Tough=0 Weird+2
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForURL(/\?view=/);
check('start', [await ratings(), await level()], [['-1', '1', '1', '0', '2'], 'Level 0']);

// The picker, cancel and back
await fillXp();
await page.getByRole('button', { name: 'Level up' }).click();
check('picker open', await dialog.isVisible(), true);
check('advanced locked', (await dialog.locator('section', { has: page.locator('h3:text-is("Advanced Improvements")') }).innerText()).includes('Not unlocked yet'), true);
check('other playbook move blocked', await option('Take a move from another playbook').first().isDisabled(), true);
await option('Take another Spell-slinger move').first().click();
await dialog.getByRole('button', { name: 'Back' }).click();
await dialog.getByRole('button', { name: 'Cancel' }).click();
check('cancel changes nothing', [await dialog.isVisible(), await level(), await page.locator('.show-improvements li').count()], [false, 'Level 0', 0]);

// A fixed effect
await page.getByRole('button', { name: 'Level up' }).click();
await option('Get +1 Weird, max +3').click();
await dialog.getByRole('button', { name: 'Take it' }).click();
check('+1 weird', [await ratings(), await level()], [['-1', '1', '1', '0', '3'], 'Level 1']);
check('xp cleared', await page.locator('.show-experience .track').innerText().then((t) => (t.match(/■/g) || []).length), 0);

// A choice, with a nested choice
await fillXp();
await page.getByRole('button', { name: 'Level up' }).click();
check('taken improvement blocked', await option('Get +1 Weird, max +3').isDisabled(), true);
await option('Take another Spell-slinger move').first().click();
check('unfinished choices allowed, with a note', [await dialog.getByRole('button', { name: 'Take it' }).isDisabled(), (await dialog.innerText()).includes('finish them later')], [false, true]);
await dialog.getByRole('checkbox', { name: /^Practitioner\b/ }).check();
await dialog.getByRole('checkbox', { name: /^Heal\b/ }).check();
await dialog.getByRole('checkbox', { name: /^Summon\b/ }).check();
await dialog.getByRole('button', { name: 'Take it' }).click();
const practitioner = page.locator('.show-move', { has: page.locator('.move-name:text-is("Practitioner:")') });
check('move from improvement, with its choices', (await practitioner.locator('.choices li').allInnerTexts()).map((t) => t.split(' ')[0]), ['Heal', 'Summon']);

// Up to level 5
await levelUpWith('Get +1 Cool, max +2');
await levelUpWith('Get +1 Sharp, max +2');
await levelUpWith('Get +1 Tough, max +2');
check('level 5', [await ratings(), await level()], [['-1', '2', '2', '1', '3'], 'Level 5']);

// Advanced: any rating (weird already at +3)
await fillXp();
await page.getByRole('button', { name: 'Level up' }).click();
await option('Get +1 to any rating, max +3').click();
check('weird at max', await dialog.getByRole('checkbox', { name: /^Weird\b/ }).isDisabled(), true);
await dialog.getByRole('checkbox', { name: /^Charm\b/ }).check();
await dialog.getByRole('button', { name: 'Take it' }).click();
check('+1 charm', [await ratings(), await level()], [['0', '2', '2', '1', '3'], 'Level 6']);

// Advanced: erase a used luck mark
for (let i = 0; i < 2; i++) await page.locator('.show-luck button.plus').click();
await levelUpWith('Erase one used Luck mark from your playbook');
check('luck mark erased', await page.locator('.show-luck .track').innerText().then((t) => (t.match(/■/g) || []).length), 1);

// Escape valve: remove an improvement on the edit page, re-take it unspent
await page.getByTitle('Edit').click();
const improvements = page.locator('#improvements .improvement');
check('edit page lists improvements', await improvements.count(), 7);
await improvements.filter({ hasText: 'Get +1 Sharp' }).getByTitle(/^Remove/).click();
await page.getByRole('button', { name: 'Save' }).click();
check('sharp back down', (await ratings())[2], '1');
await page.getByRole('button', { name: /Take an improvement \(1 unspent\)/ }).click();
await option('Get +1 Sharp, max +2').click();
await dialog.getByRole('button', { name: 'Take it' }).click();
check('re-taken without leveling', [(await ratings())[2], await level()], ['2', 'Level 7']);
check('no unspent left', await page.getByRole('button', { name: /unspent/ }).count(), 0);

// Advanced: mark basic moves as advanced (they're already yours)
await fillXp();
await page.getByRole('button', { name: 'Level up' }).click();
await option('Mark two of the basic moves as advanced').click();
check('basic moves selectable', await dialog.getByRole('checkbox', { name: /^Kick Some Ass\b/ }).isDisabled(), false);
await dialog.getByRole('checkbox', { name: /^Kick Some Ass\b/ }).check();
await dialog.getByRole('checkbox', { name: /^Use Magic\b/ }).check();
await dialog.getByRole('button', { name: 'Take it' }).click();
check('advanced on the ratings table', (await page.locator('.basic-moves li', { hasText: '(advanced)' }).allInnerTexts()).map((t) => t.trim()), ['Kick Some Ass (advanced)', 'Use Magic (advanced)']);
check('not added as moves', await page.locator('.show-move .move-name', { hasText: 'Kick Some Ass' }).count(), 0);

// Skip a level up: the improvement stays unspent
await fillXp();
await page.getByRole('button', { name: 'Level up' }).click();
await dialog.getByRole('button', { name: /^Skip/ }).click();
check('skip levels up', [await level(), await page.getByRole('button', { name: 'Take an improvement (1 unspent)' }).count()], ['Level 9', 1]);

// Improvements at the bottom of the sheet, with what was chosen
const taken = await page.locator('.show-improvements li').allInnerTexts();
check('improvements list', taken.length, 8);
check('improvement with its choice', taken.find((t) => t.startsWith('Take another Spell-slinger move')), 'Take another Spell-slinger move: Practitioner');
check('any rating shows the rating', taken.find((t) => t.startsWith('Get +1 to any rating')), 'Get +1 to any rating, max +3: Charm');
check('improvements are last', await page.locator('main > :last-child').getAttribute('class'), 'show-improvements');

await page.reload();
check('after reload', [await ratings(), await level(), await page.locator('.show-improvements li').count()], [['0', '2', '2', '1', '3'], 'Level 9', 8]);

check('console errors', errors, []);
await browser.close();
finish();
