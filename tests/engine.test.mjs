// The data layer and state engine, run against the real playbook JSON
// (through Vite, so the @/ aliases and JSON imports work).
import { createServer } from 'vite';
import { check, finish } from './check.mjs';

const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
});
const load = (p) => server.ssrLoadModule(p);
const { Hunter, asList, makeChoices } = await load('/src/Hunter.js');
const { playbooks } = await load('/src/Playbooks.js');
const D = await load('/src/PlaybookData.js');
const S = await load('/src/HunterState.js');

const h = new Hunter(playbooks[0], 'Alice');
const pb = h.playbook;
const sp = 'the_spellslinger';
check('copy, not shared', h.playbook !== playbooks[0], true);
check('getting_started mirrors the playbook', h.getting_started.choose.map((c) => c.from), ['@combat_magic', '@moves', '@starting_gear']);
check('granted records', h.getting_started.grant, ['@basic_moves', { ref: '@moves.tools_and_techniques', choices: [] }]);
check('version', h.schema_version, '0.1.2026.10.09.1');
check('created timestamp', /^\d{4}-\d\d-\d\dT/.test(h.created), true);
check('playbook updated', h.playbook_updated, '2026-10-07');
check('slug', D.slug("Could've Been Worse"), 'couldve_been_worse');
check('root-relative ref', D.refPath('@combat_magic', pb), `${sp}.combat_magic`);
check('absolute ref', D.refPath('@basic_moves.use_magic.heal', pb), 'basic_moves.use_magic.heal');
const cm = D.optionsOf('@combat_magic', pb);
check('combat magic options', cm.map((e) => `${e.group?.id}:${e.node?.name}`).slice(0, 5), ['bases:Blast', 'bases:Ball', 'bases:Missile', 'bases:Wall', 'effects:Fire']);
check('written relative to the container', cm.map((e) => e.written).slice(0, 2), ['@bases.blast', '@bases.ball']);
const practitioner = pb.moves.options.find((m) => m.name === 'Practitioner');
check('options that are references keep their reference', D.optionsOf('@this', pb, practitioner).map((e) => [e.path, e.written])[0], ['basic_moves.use_magic.inflict_harm', '@basic_moves.use_magic.inflict_harm']);
const ar = pb.moves.options.find((m) => m.name === 'Arcane Reputation');
check('three textboxes', D.optionsOf('@this', pb, ar).map((e) => e.key), ['@textbox#0', '@textbox#1', '@textbox#2']);
check('other playbooks moves (none yet)', D.optionsOf('@*.moves', pb).length, 0);

let st = S.hunterState(h);
check('granted moves', st.moves.map((m) => m.node.name), ['Tools and Techniques']);
check('granted basic moves', st.basicMoves.length, 8);
check('own features', st.features.map((f) => `${f.area}:${f.node.name}`), ['pre_moves:Combat Magic']);

// Choose the way the UI does: find the option in its container, toggle it
const pick = (record, holder, i, path) => {
    const rule = asList(holder.choose)[i];
    const entry = D.optionsOf(rule.from, pb, holder).find((e) => e.path === path);
    S.toggleChoice(S.choiceSet(record, holder, i), entry);
};
const gs = pb.getting_started;
h.ratings_base = { ...pb.ratings_base.options[0] };
for (const p of ['combat_magic.bases.blast', 'combat_magic.effects.fire', 'combat_magic.effects.earth']) pick(h.getting_started, gs, 0, `${sp}.${p}`);
for (const p of ['moves.practitioner', 'moves.arcane_reputation', 'moves.third_eye']) pick(h.getting_started, gs, 1, `${sp}.${p}`);
pick(h.getting_started, gs, 2, `${sp}.starting_gear.ritual_knife`);
const tt = D.lookup(`${sp}.moves.tools_and_techniques`, pb);
pick(S.grantRecord(h.getting_started, '@moves.tools_and_techniques'), tt, 0, `${sp}.moves.tools_and_techniques.gestures`);
const movesSet = S.choiceSet(h.getting_started, gs, 1);
pick(S.pickRecord(movesSet, '@practitioner'), practitioner, 0, 'basic_moves.use_magic.heal');
pick(S.pickRecord(movesSet, '@practitioner'), practitioner, 0, 'basic_moves.use_magic.banish');
S.setTextChoice(S.choiceSet(S.pickRecord(movesSet, '@arcane_reputation'), ar, 0), 0, 'The White Council');

check('stored: relative to the container', S.choiceSet(h.getting_started, gs, 0), { from: '@combat_magic', choices: ['@bases.blast', '@effects.fire', '@effects.earth'] });
check('stored: a grant with choices', h.getting_started.grant[1], { ref: '@moves.tools_and_techniques', choices: ['@gestures'] });
check('stored: a pick with its own choices', movesSet.choices[0], { ref: '@practitioner', choices: ['@basic_moves.use_magic.heal', '@basic_moves.use_magic.banish'] });
check('stored: free text', movesSet.choices[1], { ref: '@arcane_reputation', choices: [{ ref: '@textbox', text: 'The White Council' }] });
check('stored: plain picks are strings', [movesSet.choices[2], S.choiceSet(h.getting_started, gs, 2).choices], ['@third_eye', ['@ritual_knife']]);

st = S.hunterState(h);
check('moves', st.moves.map((m) => m.node.name), ['Tools and Techniques', 'Practitioner', 'Arcane Reputation', 'Third Eye']);
check('gear', st.gear.map((g) => g.node.name), ['Ritual knife']);
check('combat magic picks', S.picksUnder(st, `${sp}.combat_magic`).map((p) => p.node.name), ['Blast', 'Fire', 'Earth']);
check('crossed T&T', [...S.crossedUnder(st, `${sp}.moves.tools_and_techniques`)], [`${sp}.moves.tools_and_techniques.gestures`]);
check('practitioner picks', S.picksUnder(st, `${sp}.moves.practitioner`).map((p) => p.path), ['basic_moves.use_magic.heal', 'basic_moves.use_magic.banish']);
check('textbox picks', S.picksUnder(st, `${sp}.moves.arcane_reputation`).map((p) => p.text), ['The White Council']);
check('ratings base', st.ratings, { charm: -1, cool: 1, sharp: 1, tough: 0, weird: 2 });

// Improvements: a reference, or { ref, choices } when something is chosen
const take = (id, paths = []) => {
    const imp = S.findImprovement(pb, id).improvement;
    const record = { ref: S.improvementRef(pb, imp), ...makeChoices(imp) };
    h.improvements.push(record);
    paths.forEach((p) => pick(record, imp, 0, p));
    if (!imp.choose) {
        h.improvements[h.improvements.length - 1] = record.ref;
    }
    return h.improvements.at(-1);
};
h.level = 4;
check('improvement without choices is a string', take('weird'), '@improvements.weird');
check('improvement with a choice', take('any_rating', [`${sp}.improvements_advanced.any_rating.cool`]), { ref: '@improvements_advanced.any_rating', choices: ['@cool'] });
check('move from an improvement, relative to @moves', take('move_1', [`${sp}.moves.shield_spell`]), { ref: '@improvements.move_1', choices: ['@shield_spell'] });
take('advanced_basic_1', ['basic_moves.kick_some_ass', 'basic_moves.use_magic']);
st = S.hunterState(h);
check('ratings after improvements', st.ratings, { charm: -1, cool: 2, sharp: 1, tough: 0, weird: 3 });
check('move from improvement', st.moves.at(-1).node.name, 'Shield Spell');
check('advanced basic', [...st.advanced], ['basic_moves.kick_some_ass', 'basic_moves.use_magic']);
check('advancing does not add moves', st.moves.length, 5);
check('improvement by reference', S.improvementOf(pb, '@improvements_advanced.cross_off_tt')?.improvement.id, 'cross_off_tt');
check('chosen, resolved', S.chosenFor(pb, S.findImprovement(pb, 'move_1').improvement, h.improvements[2]).map((c) => c.node.name), ['Shield Spell']);

h.level = 3;
const down = S.hunterState(h);
check('level down: newest improvement disabled', [...S.improvementBudget(h).disabled].map(S.refOf), ['@improvements_advanced.advanced_basic_1']);
check('level down: its effect is gone', [...down.advanced], []);
check('level down: choices kept', h.improvements.at(-1).choices.length, 2);
check('level down: nothing unspent', S.unspentImprovements(h), 0);
h.level = 6;
check('unspent', S.unspentImprovements(h), 2);
check('mythic cost', S.costOf(pb, 'mythic_move'), 2);
h.improvements.push({ ref: '@improvements_mythic.mythic_move', cost: 2, choices: [] });
check('unspent after a mythic', S.unspentImprovements(h), 0);
h.improvements.pop();

const { parseTags } = await load('/src/Tags.js');
check('tags: spaces', parseTags('1 harm magic'), ['1-harm', 'magic']);
check('tags: commas', parseTags('1-harm, magic'), ['1-harm', 'magic']);
check('tags: trailing comma', parseTags('1-harm,'), ['1-harm']);
check('tags: comma stops the join', parseTags('1, harm'), ['1', 'harm']);
check('tags: signed numbers', parseTags('+2 harm fire'), ['+2-harm', 'fire']);

h.extra_gear.push({ name: 'Amulet', tags: ['1-harm', 'magic'] });
const { toSaved } = await load('/src/Storage.js');
const saved = toSaved(h);
const keys = Object.keys(saved);
check('saved: playbook last, computed before it', keys.slice(-2), ['computed', 'playbook']);
check('saved: updated after created', keys.indexOf('updated') === keys.indexOf('created') + 1, true);
check('saved: luck_used', [keys.includes('luck_used'), keys.includes('luck')], [true, false]);
check('saved: computed keys', Object.keys(saved.computed), ['ratings', 'moves', 'gear', 'features']);
const savedMove = (name) => saved.computed.moves.find((m) => m.name === name);
check('saved: T&T chosen (absolute)', savedMove('Tools and Techniques').chosen, [`@${sp}.moves.tools_and_techniques.gestures`]);
check('saved: Practitioner chosen', savedMove('Practitioner').chosen, ['@basic_moves.use_magic.heal', '@basic_moves.use_magic.banish']);
check('saved: Arcane Reputation chosen', savedMove('Arcane Reputation').chosen, [{ ref: '@textbox', text: 'The White Council' }]);
check('saved: no chosen on plain moves', 'chosen' in savedMove('Third Eye'), false);
check('saved: gear', saved.computed.gear.map((g) => g.name), ['Ritual knife', 'Amulet']);
check('saved: features', saved.computed.features.map((f) => [f.name, f.chosen.length]), [['Combat Magic', 3]]);
const round = Hunter.fromJSON(JSON.parse(JSON.stringify(saved)));
check('JSON round trip state', JSON.stringify(S.hunterState(round).ratings), JSON.stringify(st.ratings));
check('computed ignored on load', round.computed, undefined);
check('old save rejected', Hunter.fromJSON({ schema_version: '0.1.2026.10.09', uid: 'x', playbook: {} }), null);
await server.close();
finish();
