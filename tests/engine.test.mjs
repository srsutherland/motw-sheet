// The data layer and state engine, run against the real playbook JSON
// (through Vite, so the @/ aliases and JSON imports work).
import { reactive } from 'vue';
import { createServer } from 'vite';
import { check, finish } from './check.mjs';

const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
});
const load = (p) => server.ssrLoadModule(p);
const { Hunter, rulesOf, makeChoices } = await load('/src/Hunter.js');
const { playbooks } = await load('/src/Playbooks.js');
const D = await load('/src/PlaybookData.js');
const S = await load('/src/HunterState.js');

const spellslinger = playbooks.find((p) => p.id === 'the_spellslinger');
const h = new Hunter(spellslinger, 'Alice');
const pb = h.playbook;
const sp = 'the_spellslinger';
check('copy, not shared', h.playbook !== spellslinger, true);
check('getting_started mirrors the playbook', h.getting_started.choose.map((c) => c.from), ['@combat_magic', '@moves', '@starting_gear']);
check('granted records', h.getting_started.grant, [{ ref: '@moves.tools_and_techniques', chosen: [] }]);
check('version', h.schema_version, '0.1.2026.10.16');
check('created timestamp', /^\d{4}-\d\d-\d\dT/.test(h.created), true);
check('playbook updated', h.playbook_updated, spellslinger.updated);
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
check('onPage: no override', D.onPage({ description: 'a' }, 'description', 'edit'), 'a');
check('onPage: override', D.onPage({ description: 'a', on_view: { description: 'b' } }, 'description', 'view'), 'b');
check('onPage: other page', D.onPage({ description: 'a', on_view: { description: 'b' } }, 'description', 'edit'), 'a');
check('onPage: splice a string', D.onPage({ description: 'a', on_edit: { description: ['@...', 'b'] } }, 'description', 'edit'), ['a', 'b']);
check('onPage: splice an array', D.onPage({ description: ['a', 'b'], on_edit: { description: ['z', '@...'] } }, 'description', 'edit'), ['z', 'a', 'b']);
check('onPage: new key', D.onPage({ on_edit: { details: ['x', '@...'] } }, 'details', 'edit'), ['x']);
check('rulesOf: from defaults to @this', rulesOf({ choose: { pick: 1 } }), [{ pick: 1, from: '@this' }]);
check('other playbooks moves: not your own', D.optionsOf('@*.moves', pb).some((o) => o.group === 'The Spell-Slinger'), false);

let st = S.hunterState(h);
check('granted moves', st.moves.map((m) => m.node.name), ['Tools and Techniques']);
check('basic moves, implicit', st.basicMoves.length, 8);
check('own features', st.features.map((f) => `${f.area}:${f.node.name}`), ['pre_moves:Combat Magic']);

// Choose the way the UI does: find the option in its container, toggle it
const pick = (record, holder, i, path) => {
    const rule = rulesOf(holder)[i];
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

check('stored: relative to the container', S.choiceSet(h.getting_started, gs, 0), { from: '@combat_magic', chosen: ['@bases.blast', '@effects.fire', '@effects.earth'] });
check('stored: a grant with choices', h.getting_started.grant[0], { ref: '@moves.tools_and_techniques', chosen: ['@gestures'] });
check('stored: a pick with its own choices', movesSet.chosen[0], { ref: '@practitioner', chosen: ['@basic_moves.use_magic.heal', '@basic_moves.use_magic.banish'] });
check('stored: free text', movesSet.chosen[1], { ref: '@arcane_reputation', chosen: [{ ref: '@textbox', text: 'The White Council' }] });
check('stored: plain picks are strings', [movesSet.chosen[2], S.choiceSet(h.getting_started, gs, 2).chosen], ['@third_eye', ['@ritual_knife']]);

st = S.hunterState(h);
check('moves', st.moves.map((m) => m.node.name), ['Tools and Techniques', 'Practitioner', 'Arcane Reputation', 'Third Eye']);
check('gear', st.gear.map((g) => g.node.name), ['Ritual knife']);
check('combat magic picks', S.picksUnder(st, `${sp}.combat_magic`).map((p) => p.node.name), ['Blast', 'Fire', 'Earth']);
check('crossed T&T', [...S.crossedUnder(st, `${sp}.moves.tools_and_techniques`)], [`${sp}.moves.tools_and_techniques.gestures`]);
check('practitioner picks', S.picksUnder(st, `${sp}.moves.practitioner`).map((p) => p.path), ['basic_moves.use_magic.heal', 'basic_moves.use_magic.banish']);
check('textbox picks', S.picksUnder(st, `${sp}.moves.arcane_reputation`).map((p) => p.text), ['The White Council']);
check('ratings base', st.ratings, { charm: -1, cool: 1, sharp: 1, tough: 0, weird: 2 });

// Improvements: a reference, or { ref, chosen } when something is chosen
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
check('improvement with a choice', take('any_rating', [`${sp}.improvements_advanced.any_rating.cool`]), { ref: '@improvements_advanced.any_rating', chosen: ['@cool'] });
check('move from an improvement, relative to @moves', take('move_1', [`${sp}.moves.shield_spell`]), { ref: '@improvements.move_1', chosen: ['@shield_spell'] });
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
check('level down: choices kept', h.improvements.at(-1).chosen.length, 2);
check('level down: nothing unspent', S.unspentImprovements(h), 0);
h.level = 6;
check('unspent', S.unspentImprovements(h), 2);
check('mythic cost', S.costOf(pb, 'mythic_move'), 2);
h.improvements.push({ ref: '@improvements_mythic.mythic_move', cost: 2, chosen: [] });
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

const rh = reactive(new Hunter(spellslinger, 'Reactive'));
rh.level = 13;
rh.improvements.push('@improvements.move_1', '@improvements_mythic.mythic_move');
const rst = S.hunterState(rh);
const imp = (id) => S.findImprovement(rh.playbook, id).improvement;
check('repeat: taken improvement blocked (reactive hunter)', S.improvementBlocked(rh, imp('move_1'), rst, 5), 'already taken');
check('repeat: its twin is not', S.improvementBlocked(rh, imp('move_2'), rst, 5), null);
check('repeat: mythic can be taken again', S.improvementBlocked(rh, imp('mythic_move'), rst, 5), null);
check('saved: playbook last, computed before it', keys.slice(-2), ['computed', 'playbook']);
check('saved: updated after created', keys.indexOf('updated') === keys.indexOf('created') + 1, true);
check('saved: luck_used', [keys.includes('luck_used'), keys.includes('luck')], [true, false]);
check('saved: computed keys', Object.keys(saved.computed), ['ratings', 'moves', 'gear', 'features']);
const savedMove = (name) => saved.computed.moves.find((m) => m.name === name);
check('saved: T&T crossed (relative)', [savedMove('Tools and Techniques').crossed, 'selected' in savedMove('Tools and Techniques')], [['@gestures'], false]);
check('saved: Practitioner selected', savedMove('Practitioner').selected, ['@basic_moves.use_magic.heal', '@basic_moves.use_magic.banish']);
check('saved: Arcane Reputation selected', savedMove('Arcane Reputation').selected, [{ ref: '@textbox', text: 'The White Council' }]);
check('saved: no selected on plain moves', 'selected' in savedMove('Third Eye'), false);
check('saved: gear', saved.computed.gear.map((g) => g.name), ['Ritual knife', 'Amulet']);
check('saved: features', saved.computed.features.map((f) => [f.name, f.selected]), [['Combat Magic', ['@bases.blast', '@effects.fire', '@effects.earth']]]);
const round = Hunter.fromJSON(JSON.parse(JSON.stringify(saved)));
check('JSON round trip state', JSON.stringify(S.hunterState(round).ratings), JSON.stringify(st.ratings));
check('computed ignored on load', round.computed, undefined);
check('old save rejected', Hunter.fromJSON({ schema_version: '0.1.2026.10.09.1', uid: 'x', playbook: {} }), null);

// The Expert: a post-moves feature, no granted moves, and moves from another playbook
const ex = 'the_expert';
const e = new Hunter(playbooks.find((p) => p.id === ex), 'Bea');
const epb = e.playbook;
const pickIn = (playbook, record, holder, i, path) => {
    const rule = rulesOf(holder)[i];
    const entry = D.optionsOf(rule.from, playbook, holder).find((o) => o.path === path);
    S.toggleChoice(S.choiceSet(record, holder, i), entry);
};
let est = S.hunterState(e);
check('expert: nothing granted; basic moves anyway', [e.getting_started.grant, est.moves.length, est.basicMoves.length], [[], 0, 8]);
check('expert: haven is post-moves', est.features.map((f) => `${f.area}:${f.path}`), [`post_moves:${ex}.haven`]);
const egs = epb.getting_started;
for (const p of ['lore_library', 'armory', 'panic_room']) pickIn(epb, e.getting_started, egs, 0, `${ex}.haven.${p}`);
for (const p of ['dark_past', 'the_woman_or_man_with_the_plan']) pickIn(epb, e.getting_started, egs, 1, `${ex}.moves.${p}`);
for (const p of ['silver_sword', 'magnum', 'juju_bag']) pickIn(epb, e.getting_started, egs, 2, `${ex}.starting_gear.${p}`);
check('expert: stored haven', S.choiceSet(e.getting_started, egs, 0), { from: '@haven', chosen: ['@lore_library', '@armory', '@panic_room'] });
est = S.hunterState(e);
check('expert: moves', est.moves.map((m) => m.node.name), ['Dark Past', 'The Woman (or Man) With The Plan']);
check('expert: gear', est.gear.map((g) => g.node.name), ['Silver sword', 'Magnum', 'Juju bag']);
check('expert: haven picks', S.picksUnder(est, `${ex}.haven`).map((p) => p.node.name), ['Lore Library', 'Armory', 'Panic Room']);
check('expert: Dark Past questions are details', D.lookup(`${ex}.moves.dark_past`, epb).details.length, 4);

const etake = (id) => {
    const imp = S.findImprovement(epb, id).improvement;
    e.improvements.push({ ref: S.improvementRef(epb, imp), ...makeChoices(imp) });
    return [imp, e.improvements.at(-1)];
};
e.level = 2;
const [havenImp, havenRec] = etake('haven_1');
pickIn(epb, havenRec, havenImp, 0, `${ex}.haven.infirmary`);
check('expert: haven option from an improvement', S.picksUnder(S.hunterState(e), `${ex}.haven`).length, 4);
const [otherImp, otherRec] = etake('other_move_1');
check('expert: other playbooks offer the Spell-Slinger moves', D.optionsOf('@*.moves', epb).map((o) => o.group).filter((g) => g === 'The Spell-Slinger').length, 11);
pickIn(epb, otherRec, otherImp, 0, 'the_spellslinger.moves.practitioner');
check('expert: another playbook\'s move is stored absolute', otherRec.chosen, [{ ref: '@the_spellslinger.moves.practitioner', chosen: [] }]);
const spPractitioner = D.lookup('the_spellslinger.moves.practitioner');
pickIn(epb, S.pickRecord(otherRec, '@the_spellslinger.moves.practitioner'), spPractitioner, 0, 'basic_moves.use_magic.observe');
est = S.hunterState(e);
check('expert: gained Practitioner', est.moves.at(-1).node.name, 'Practitioner');
check('expert: Practitioner\'s choices', S.picksUnder(est, 'the_spellslinger.moves.practitioner').map((p) => p.path), ['basic_moves.use_magic.observe']);
const esaved = toSaved(e);
check('expert: saved haven', esaved.computed.features.map((f) => [f.name, f.selected]), [['Haven', ['@lore_library', '@armory', '@panic_room', '@infirmary']]]);
check('expert: round trip', S.hunterState(Hunter.fromJSON(JSON.parse(JSON.stringify(esaved)))).moves.length, 3);
check('spell-slinger: offered the Expert moves', D.optionsOf('@*.moves', pb).filter((o) => o.group === 'The Expert').length, 7);

// The Monstrous: plain-string options, choices inside a picked option, a borrowed move,
// another playbook's feature, crossing off a picked option
const mo = 'the_monstrous';
const m = new Hunter(playbooks.find((p) => p.id === mo), 'Vlad');
const mpb = m.playbook;
const mgs = mpb.getting_started;
m.ratings_base = { ...mpb.ratings_base.options[0] };
// `written`: how the option is stored (a plain string option has no path)
const pickW = (record, holder, i, written) => {
    const rule = rulesOf(holder)[i];
    const entry = D.optionsOf(rule.from, mpb, holder).find((o) => o.written === written);
    S.toggleChoice(S.choiceSet(record, holder, i), entry);
};
check('monstrous: plain string options', D.optionsOf('@monster_breed.origin', mpb).map((o) => [o.literal ?? false, o.written]), [[true, 'Always this way'], [true, 'Originally human, transformed somehow'], [false, '@textbox']]);
pickW(m.getting_started, mgs, 0, 'Originally human, transformed somehow');
S.setTextChoice(S.choiceSet(m.getting_started, mgs, 1), 0, 'Evil until 1890');
pickW(m.getting_started, mgs, 2, '@pure_drive');
const pureDrive = D.lookup(`${mo}.curse.pure_drive`, mpb);
pickW(S.pickRecord(S.choiceSet(m.getting_started, mgs, 2), '@pure_drive'), pureDrive, 0, 'hunger');
pickW(m.getting_started, mgs, 3, '@bases.teeth');
pickW(m.getting_started, mgs, 3, '@extras.add_1_harm_to_a_base');
const plusHarm = D.lookup(`${mo}.natural_attacks.extras.add_1_harm_to_a_base`, mpb);
pickW(S.pickRecord(S.choiceSet(m.getting_started, mgs, 3), '@extras.add_1_harm_to_a_base'), plusHarm, 0, '@teeth');
pickW(m.getting_started, mgs, 4, '@something_borrowed');
pickW(m.getting_started, mgs, 4, '@immortal');
check('monstrous: stored', m.getting_started.choose.map((c) => c.chosen), [
    ['Originally human, transformed somehow'],
    [{ ref: '@textbox', text: 'Evil until 1890' }],
    [{ ref: '@pure_drive', chosen: ['hunger'] }],
    ['@bases.teeth', { ref: '@extras.add_1_harm_to_a_base', chosen: ['@teeth'] }],
    [{ ref: '@something_borrowed', chosen: [] }, '@immortal'],
    [],
]);
const borrowed = D.lookup(`${mo}.moves.something_borrowed`, mpb);
const borrowedRecord = S.pickRecord(S.choiceSet(m.getting_started, mgs, 4), '@something_borrowed');
pickW(borrowedRecord, borrowed, 0, '@the_expert.moves.preparedness');
let mst = S.hunterState(m);
check('monstrous: features', mst.features.map((f) => f.node.name), ['Monster Breed', 'Curse', 'Natural Attacks']);
check('monstrous: breed picks', S.picksUnder(mst, `${mo}.monster_breed`).map((p) => p.text), ['Originally human, transformed somehow', 'Evil until 1890']);
check('monstrous: curse, its emotion kept with it', [S.picksUnder(mst, `${mo}.curse`).map((p) => p.node?.name ?? p.text), S.picksUnder(mst, `${mo}.curse.pure_drive`).map((p) => p.text)], [['Pure Drive'], ['hunger']]);
check('monstrous: natural attacks', S.picksUnder(mst, `${mo}.natural_attacks`).map((p) => p.node?.name ?? p.text), ['teeth', 'Add +1 harm to a base']);
check('monstrous: extra attached to its base', S.attachedTo(mst, `${mo}.natural_attacks.bases.teeth`).map((n) => n.name), ['Add +1 harm to a base']);
check('monstrous: borrowed move', mst.moves.map((m2) => m2.node.name), ['Something Borrowed', 'Immortal', 'Preparedness']);

m.level = 7;
const mtake = (id) => {
    const imp = S.findImprovement(mpb, id).improvement;
    m.improvements.push({ ref: S.improvementRef(mpb, imp), ...makeChoices(imp) });
    return [imp, m.improvements.at(-1)];
};
const [mhaven, mhavenRec] = mtake('haven');
pickW(mhavenRec, mhaven, 0, '@oubliette');
pickW(mhavenRec, mhaven, 0, '@panic_room');
mst = S.hunterState(m);
check('monstrous: haven from the Expert', mst.features.map((f) => `${f.area}:${f.path}`).at(-1), 'post_moves:the_expert.haven');
check('monstrous: haven picks', S.picksUnder(mst, 'the_expert.haven').map((p) => p.node.name), ['Oubliette', 'Panic Room']);
// an improvement adds an extra to a base you already have
const [mna, mnaRec] = mtake('natural_attacks');
pickW(mnaRec, mna, 0, '@extras.add_ignore_armour_to_a_base');
const ignoreArmour = D.lookup(`${mo}.natural_attacks.extras.add_ignore_armour_to_a_base`, mpb);
pickW(S.pickRecord(mnaRec, '@extras.add_ignore_armour_to_a_base'), ignoreArmour, 0, '@teeth');
mst = S.hunterState(m);
check('monstrous: second extra on the same base', S.attachedTo(mst, `${mo}.natural_attacks.bases.teeth`).map((n) => n.name), ['Add +1 harm to a base', 'Add ignore-armour to a base']);
check('monstrous: teeth picked once', S.picksUnder(mst, `${mo}.natural_attacks`).filter((p) => p.node?.name === 'teeth').length, 1);
const [mfree, mfreeRec] = mtake('free_from_curse');
pickW(mfreeRec, mfree, 0, '@pure_drive');
mst = S.hunterState(m);
check('monstrous: curse crossed, -1 Weird', [[...S.crossedUnder(mst, `${mo}.curse`)], mst.ratings.weird], [[`${mo}.curse.pure_drive`], 2]);
const msaved = toSaved(m);
check('monstrous: saved features', msaved.computed.features.map((f) => [f.name, f.selected]), [
    ['Monster Breed', ['Originally human, transformed somehow', { ref: '@textbox', text: 'Evil until 1890' }]],
    ['Curse', ['@pure_drive']],
    ['Natural Attacks', ['@bases.teeth', '@extras.add_1_harm_to_a_base', '@extras.add_ignore_armour_to_a_base']],
    ['Haven', ['@oubliette', '@panic_room']],
]);
check('monstrous: saved crossed curse', msaved.computed.features[1].crossed, ['@pure_drive']);
await server.close();
finish();
