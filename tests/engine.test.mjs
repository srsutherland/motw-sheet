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
const { Hunter } = await load('/src/Hunter.js');
const { playbooks } = await load('/src/Playbooks.js');
const D = await load('/src/PlaybookData.js');
const S = await load('/src/HunterState.js');

const h = new Hunter(playbooks[0], 'Alice');
const pb = h.playbook;
check('copy, not shared', h.playbook !== playbooks[0], true);
check('getting_started lists', h.getting_started.length, 3);
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
h.getting_started[0].push('the_spellslinger.combat_magic.bases.blast', 'the_spellslinger.combat_magic.effects.fire', 'the_spellslinger.combat_magic.effects.earth');
h.getting_started[1].push('the_spellslinger.moves.practitioner', 'the_spellslinger.moves.arcane_reputation', 'the_spellslinger.moves.third_eye');
h.getting_started[2].push('the_spellslinger.starting_gear.ritual_knife');
h.nested['the_spellslinger.moves.tools_and_techniques'] = [['the_spellslinger.moves.tools_and_techniques.gestures']];
h.nested['the_spellslinger.moves.practitioner'] = [['basic_moves.use_magic.heal', 'basic_moves.use_magic.banish']];
h.nested['the_spellslinger.moves.arcane_reputation'] = [[{ id: '@textbox', text: 'The White Council' }]];
st = S.hunterState(h);
check('moves', st.moves.map((m) => m.node.name), ['Tools and Techniques', 'Practitioner', 'Arcane Reputation', 'Third Eye']);
check('gear', st.gear.map((g) => g.node.name), ['Ritual knife']);
check('combat magic picks', S.picksUnder(st, 'the_spellslinger.combat_magic').map((p) => p.node.name), ['Blast', 'Fire', 'Earth']);
check('crossed T&T', [...S.crossedUnder(st, 'the_spellslinger.moves.tools_and_techniques')], ['the_spellslinger.moves.tools_and_techniques.gestures']);
check('practitioner picks', S.picksUnder(st, 'the_spellslinger.moves.practitioner').map((p) => p.path), ['basic_moves.use_magic.heal', 'basic_moves.use_magic.banish']);
check('textbox picks', S.picksUnder(st, 'the_spellslinger.moves.arcane_reputation').map((p) => p.text), ['The White Council']);
check('ratings base', st.ratings, { charm: -1, cool: 1, sharp: 1, tough: 0, weird: 2 });

h.improvements.push({ id: 'weird', choices: [] });
h.improvements.push({ id: 'any_rating', choices: [['the_spellslinger.improvements_advanced.any_rating.cool']] });
h.improvements.push({ id: 'move_1', choices: [['the_spellslinger.moves.shield_spell']] });
h.improvements.push({ id: 'advanced_basic_1', choices: [['basic_moves.kick_some_ass', 'basic_moves.use_magic']] });
st = S.hunterState(h);
check('ratings after improvements', st.ratings, { charm: -1, cool: 2, sharp: 1, tough: 0, weird: 3 });
check('move from improvement', st.moves.at(-1).node.name, 'Shield Spell');
check('advanced basic', [...st.advanced], ['basic_moves.kick_some_ass', 'basic_moves.use_magic']);
check('find improvement', S.findImprovement(pb, 'cross_off_tt')?.list.id, 'improvements_advanced');

const round = Hunter.fromJSON(JSON.parse(JSON.stringify(h)));
check('JSON round trip state', JSON.stringify(S.hunterState(round).ratings), JSON.stringify(st.ratings));
check('old save rejected', Hunter.fromJSON({ uid: 'x', playbook: {} }), null);
await server.close();
finish();
