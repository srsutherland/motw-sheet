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
const { Hunter, makeChoose } = await load('/src/Hunter.js');
const { playbooks } = await load('/src/Playbooks.js');
const D = await load('/src/PlaybookData.js');
const S = await load('/src/HunterState.js');

const h = new Hunter(playbooks[0], 'Alice');
const pb = h.playbook;
check('copy, not shared', h.playbook !== playbooks[0], true);
check('getting_started mirrors the playbook', h.getting_started.choose.map((c) => c.from), ['@combat_magic', '@moves', '@starting_gear']);
check('granted records', h.getting_started.grant, ['@basic_moves', { ref: '@moves.tools_and_techniques', choose: [{ from: '@this', choices: [] }] }]);
check('version', h.schema_version, '0.1.2026.10.07');
check('playbook updated', h.playbook_updated, '2026-10-07');
check('slug', D.slug("Could've Been Worse"), 'couldve_been_worse');
check('root-relative ref', D.refPath('@combat_magic', pb), 'the_spellslinger.combat_magic');
check('absolute ref', D.refPath('@basic_moves.use_magic.heal', pb), 'basic_moves.use_magic.heal');
const cm = D.optionsOf('@combat_magic', pb);
check('combat magic options', cm.map((e) => `${e.group?.id}:${e.node?.name}`).slice(0, 5), ['bases:Blast', 'bases:Ball', 'bases:Missile', 'bases:Wall', 'effects:Fire']);
const practitioner = pb.moves.options.find((m) => m.name === 'Practitioner');
check('@this + refs into basic_moves', D.optionsOf('@this', pb, practitioner).map((e) => e.path).slice(0, 2), ['basic_moves.use_magic.inflict_harm', 'basic_moves.use_magic.enchant_weapon']);
const ar = pb.moves.options.find((m) => m.name === 'Arcane Reputation');
check('three textboxes', D.optionsOf('@this', pb, ar).map((e) => e.key), ['@textbox#0', '@textbox#1', '@textbox#2']);
check('other playbooks moves (none yet)', D.optionsOf('@*.moves', pb).length, 0);

let st = S.hunterState(h);
check('granted moves', st.moves.map((m) => m.node.name), ['Tools and Techniques']);
check('granted basic moves', st.basicMoves.length, 8);
check('own features', st.features.map((f) => `${f.area}:${f.node.name}`), ['pre_moves:Combat Magic']);

h.ratings_base = { ...pb.ratings_base.options[0] };
const gs = pb.getting_started;
const set = (record, holder, i) => S.choiceSet(record, holder, i);
const pick = (s1, path) => S.toggleChoice(s1, path, D.lookup(path, pb));
const sp = 'the_spellslinger';
for (const p of ['combat_magic.bases.blast', 'combat_magic.effects.fire', 'combat_magic.effects.earth']) pick(set(h.getting_started, gs, 0), `${sp}.${p}`);
for (const p of ['moves.practitioner', 'moves.arcane_reputation', 'moves.third_eye']) pick(set(h.getting_started, gs, 1), `${sp}.${p}`);
pick(set(h.getting_started, gs, 2), `${sp}.starting_gear.ritual_knife`);
const tt = D.lookup(`${sp}.moves.tools_and_techniques`, pb);
pick(set(S.grantRecord(h.getting_started, '@moves.tools_and_techniques'), tt, 0), `${sp}.moves.tools_and_techniques.gestures`);
const movesSet = set(h.getting_started, gs, 1);
pick(set(S.pickRecord(movesSet, `${sp}.moves.practitioner`), practitioner, 0), 'basic_moves.use_magic.heal');
pick(set(S.pickRecord(movesSet, `${sp}.moves.practitioner`), practitioner, 0), 'basic_moves.use_magic.banish');
S.setTextChoice(set(S.pickRecord(movesSet, `${sp}.moves.arcane_reputation`), ar, 0), 0, 'The White Council');
check('stored: references with @', set(h.getting_started, gs, 0), { from: '@combat_magic', choices: ['@the_spellslinger.combat_magic.bases.blast', '@the_spellslinger.combat_magic.effects.fire', '@the_spellslinger.combat_magic.effects.earth'] });
check('stored: a pick with its own choices', movesSet.choices[0], { ref: '@the_spellslinger.moves.practitioner', choose: [{ from: '@this', choices: ['@basic_moves.use_magic.heal', '@basic_moves.use_magic.banish'] }] });
check('stored: free text', movesSet.choices[1].choose[0].choices, [{ id: '@textbox', text: 'The White Council' }]);
st = S.hunterState(h);
check('moves', st.moves.map((m) => m.node.name), ['Tools and Techniques', 'Practitioner', 'Arcane Reputation', 'Third Eye']);
check('gear', st.gear.map((g) => g.node.name), ['Ritual knife']);
check('combat magic picks', S.picksUnder(st, 'the_spellslinger.combat_magic').map((p) => p.node.name), ['Blast', 'Fire', 'Earth']);
check('crossed T&T', [...S.crossedUnder(st, 'the_spellslinger.moves.tools_and_techniques')], ['the_spellslinger.moves.tools_and_techniques.gestures']);
check('practitioner picks', S.picksUnder(st, 'the_spellslinger.moves.practitioner').map((p) => p.path), ['basic_moves.use_magic.heal', 'basic_moves.use_magic.banish']);
check('textbox picks', S.picksUnder(st, 'the_spellslinger.moves.arcane_reputation').map((p) => p.text), ['The White Council']);
check('ratings base', st.ratings, { charm: -1, cool: 1, sharp: 1, tough: 0, weird: 2 });

const take = (id, picks = []) => {
    const imp = S.findImprovement(pb, id).improvement;
    const record = { id, ...(imp.choose ? { choose: makeChoose(imp) } : {}) };
    h.improvements.push(record);
    picks.forEach((p) => pick(set(record, imp, 0), p));
    return record;
};
check('no empty choose', 'choose' in take('weird'), false);
take('any_rating', ['the_spellslinger.improvements_advanced.any_rating.cool']);
take('move_1', ['the_spellslinger.moves.shield_spell']);
take('advanced_basic_1', ['basic_moves.kick_some_ass', 'basic_moves.use_magic']);
st = S.hunterState(h);
check('ratings after improvements', st.ratings, { charm: -1, cool: 2, sharp: 1, tough: 0, weird: 3 });
check('move from improvement', st.moves.at(-1).node.name, 'Shield Spell');
check('advanced basic', [...st.advanced], ['basic_moves.kick_some_ass', 'basic_moves.use_magic']);
check('advancing does not add moves', st.moves.length, 5);
check('find improvement', S.findImprovement(pb, 'cross_off_tt')?.list.id, 'improvements_advanced');

h.level = 6;
check('unspent', S.unspentImprovements(h), 2);
check('mythic cost', S.costOf(pb, 'mythic_move'), 2);
h.improvements.push({ id: 'mythic_move', cost: 2, choose: [{ from: '@moves', choices: [] }] });
check('unspent after a mythic', S.unspentImprovements(h), 0);
h.improvements.pop();

const round = Hunter.fromJSON(JSON.parse(JSON.stringify({ ...h, ratings: { charm: 99 }, moves: ['junk'] })));
check('JSON round trip state', JSON.stringify(S.hunterState(round).ratings), JSON.stringify(st.ratings));
check('saved ratings/moves ignored on load', [round.ratings, round.moves], [undefined, undefined]);
check('old save rejected', Hunter.fromJSON({ schema_version: '0.1', uid: 'x', playbook: {} }), null);
await server.close();
finish();
