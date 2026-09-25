# Playbook schema notes

Design notes for step 1 of `ROADMAP.md`: a playbook JSON shape (and matching
saved-hunter shape) that fits all 12 playbooks, so that adding the other 11
after MVP is data entry.

Source material: `playbooks/md/*.md`. Survey last checked 2026-09-24.

## The problem with the current shape

`the-spellslinger.json` puts its special content under keys named after where
it appears on the Spell-Slinger's sheet: `pre_moves` (Combat Magic),
`moves.you_get` (Tools & Techniques), `moves.children` (the move picks). A
renderer that reads those keys is a Spell-Slinger renderer. Every other
playbook has its own sections with their own selection rules, and several
improvements reach into sections by name, including sections owned by other
playbooks.

The direction: a playbook is **an ordered list of sections, each with a stable
id and a selection rule drawn from a small shared vocabulary**. The renderer
knows the vocabulary, not the playbooks. Improvements refer to sections by id.

## Survey: playbook-specific sections

Everything every playbook has (luck, harm, experience, ratings lines, look,
introductions, history, improvements) is left out unless it varies.

| Playbook | Section | Rule |
|---|---|---|
| Chosen | Fate: how you found out | pick 1 |
| | Fate: heroic tags / doom tags | pick 2 from each list |
| | Special weapon | 1 form + 3 business-end + material (free text with suggestions); tags add up into a weapon |
| | Protective gear | optional, 1-armour |
| Crooked | Background | pick 1 (each option is effectively a move) |
| | Heat | pick **at least** 2, each with a name blank |
| | Underworld | pick 1; each option has its own pick-1 sub-choice |
| Divine | Mission | pick 1 |
| | Divine weapon | pick 1 |
| Expert | Haven | pick 3 of 9 |
| Flake | Gear | 1 normal weapon + 2 hidden weapons |
| Initiate | Sect | free-text questions; good traditions pick 2, bad traditions pick 1 |
| | Gear | 3 old-fashioned, or 2 modern, or 2 + 1, **depending on the Sect's traditions** |
| Monstrous | Breed | free-text origin questions; curse pick 1 (some curses have a blank: a substance, an emotion) |
| | Natural attacks | a base + an extra, **or** two bases |
| | Breed suggestions | reference only (preset combinations of curse, attacks, moves) |
| | Gear | optional, pick 0–1 |
| Mundane | Gear | 2 weapons + 1 means of transport |
| Professional | Agency | free-text questions; resources pick 2, red tape pick 2 |
| | Gear | 1 serious + 2 normal weapons; flak vest **or** combat armour |
| Spell-Slinger | Combat Magic | pick 3 across bases and effects, at least 1 base |
| | Tools & Techniques | cross off 1 of 4 |
| Spooky | Dark side | pick 3 tags |
| Wronged | Who you lost | pick **1 or more**, each with a name blank |
| | My prey | free text (a monster breed) |
| | Why couldn't you save them | pick 1 or more |
| | Gear | 1 signature + 2 practical weapons; optional vehicle |

Moves vary too:

- **Granted moves** before the picks: Chosen gets 2; Initiate, Professional,
  Spell-Slinger, and Wronged get 1 (marked `[x]` in the markdown).
- **Moves with their own choices**: Practitioner (pick 2 of 10), Crooked's
  Artifact (pick 1) and Deal with the Devil (pick 1 or 2), Professional's
  Mobility (2 good things + 1 bad thing), Spooky's Hex.
- **Moves that change ratings**: Professional's Unfazeable (+1 Cool, max +3).
  Deal with the Devil's "skill" option adds +1 to two ratings.

Look has 2 lists in seven playbooks and 3 in five; every list ends in a
free-text blank. Every playbook has a pronouns blank and a luck special.

## Survey: improvements that aren't boilerplate

Every playbook shares rating increases, extra moves, moves from other
playbooks, and the advanced list (change playbook, second hunter, advanced
basic moves, retire, erase luck). Beyond those:

| Kind | Examples |
|---|---|
| More picks in a section | Combat Magic pick (Spell-Slinger), natural attacks pick (Monstrous), haven option (Expert, Flake, Wronged), Agency resource (Professional) |
| Cross off one more | Tools & Techniques (Spell-Slinger) |
| **Gain another playbook's section** | "a haven, like the Expert has, with two options" (Flake, Monstrous, Wronged); "a mystical library, like the Expert's haven option" (Spooky: one specific option) |
| Redo a choice | change mission (Divine), change dark side tags (Spooky), change prey (Wronged), change a red tape tag (Professional) |
| Remove a choice | delete a doom tag and optionally a heroic tag (Chosen), delete a dark side tag (Spooky) |
| Compound | Monstrous: curse no longer applies **and** lose 1 Weird |
| Narrative only | gain an ally, stash of money, command of a team, Keeper makes the next mystery about your prey |

Four playbooks borrow the haven, so **the haven isn't the Expert's**: it's a
shared section definition that the Expert starts with and others can gain.

## Proposed model

A rough shape to test, not a final spec.

### Sections

```jsonc
{
  "id": "combat_magic",          // stable, authored, unique within the playbook
  "heading": "Combat Magic",
  "description": "…",            // markdown, per DESIGN.md
  "select": { … },               // absent for display-only sections
  "options": [ … ]               // or "groups": [ { "id", "heading", "options" } ]
}
```

Options have their own authored `id`, display text, optional `tags`, and may
carry a nested `select` + `options` (for Underworld, Practitioner, Artifact) or
a `blank` (for Heat, Who You Lost, curses with a substance).

Moves, gear, look, and history are sections like any other; the renderer can
still give them a special layout by id or kind. Where a section appears on the
page (before or after moves) is layout, not structure. `pre_moves` goes away.

### Selection rules

| Rule | Covers |
|---|---|
| `{ "pick": 3 }` | most sections |
| `{ "min": 1 }`, `{ "min": 2 }` | "one or more" (Wronged), "at least two" (Heat) |
| `{ "min": 0, "pick": 1 }` | optional gear |
| `{ "cross": 1 }` | Tools & Techniques |
| per-group counts: `{ "groups": { "form": 1, "end": 3 } }` | Chosen weapon, Flake/Mundane/Professional/Wronged gear, heroic/doom tags |
| total plus per-group minimum: `{ "pick": 3, "groups": { "base": { "min": 1 } } }` | Combat Magic |
| `{ "any_of": [ {…}, {…} ] }`: satisfies any one of several rules | Natural attacks (`base 1 + extra 1` or `base 2`), Professional armour, Initiate gear |
| `{ "free_text": true }` alongside options | look, Chosen material |

`any_of` is the escape hatch that keeps compound rules as data. The Initiate's
gear is the one rule that depends on another section's choices; the simplest
honest answer may be `any_of` with the player choosing, since the app doesn't
need to police it.

### Improvements

Every improvement gets an authored `id` and a list of effects:

```jsonc
{ "id": "combat_magic_pick_1", "text": "Take another Combat Magic pick",
  "effects": [ { "section": "combat_magic", "add_picks": 1 } ] }

{ "id": "gain_haven", "text": "Gain a haven, like the Expert has, with two options",
  "effects": [ { "add_section": "haven", "pick": 2 } ] }

{ "id": "free_from_curse", "text": "Free yourself from the curse of your kind…",
  "effects": [ { "section": "curse", "disable": true },
               { "rating": "weird", "add": -1 } ] }
```

An improvement with no effects is narrative only and is just recorded. Effect
kinds: `rating` (with `max`), `add_picks`, `add_cross`, `add_section`,
`redo` (re-open a section), `remove` (drop N choices), `luck`,
`moves_other`, plus the advanced-list specials.

`add_section` needs somewhere to find the haven. Put shared sections in their
own file (e.g. `playbooks/shared/haven.json`), referenced by id from the Expert
and from the improvements that grant it.

## Saved hunters

The playbook is an immutable template; the hunter is the player's choices
against it.

```jsonc
{
  "version": 1,
  "uid": "…",
  "playbook_id": "the_spellslinger",
  "name": "…", "pronouns": "…",
  "ratings_line": 2,                       // index into playbook.ratings
  "choices": {
    "combat_magic": ["blast", "fire", "earth"],
    "tools_and_techniques": { "crossed": ["gestures"] },
    "moves": ["third_eye", { "id": "practitioner", "choices": ["inflict_harm", "heal"] }],
    "look_eyes": { "text": "weary" }
  },
  "improvements": ["weird_1", "combat_magic_pick_1"],
  "harm": 0, "unstable": false, "luck": 0, "experience": 0,
  "history": [ { "name": "…", "option": "mentor", "notes": "…" } ]
}
```

Current ratings, pick limits, and borrowed sections are all computed from
the playbook, the ratings line, and the improvements taken, never stored.

Consequences:
- Playbook text fixes reach every existing hunter.
- Saves shrink from ~16 KB (the embedded playbook today) to a few hundred bytes,
  which also makes share-by-URL plausible later.
- `version` lets the loader upgrade old saves. Hunters saved in the current
  format (with the embedded playbook) can be upgraded by matching option names;
  given that nothing is released, discarding them is also fine.
- Option ids are now part of the save format: renaming one requires a
  migration, the same as renaming a database column.

## Still to decide

- How strictly to validate choices. The paper sheet doesn't stop you
  over-picking; the app could warn rather than block, which also sidesteps the
  Initiate's conditional gear.
- Whether "moves from another playbook" can load another playbook's JSON at
  MVP, or waits until those playbooks exist.
- Whether Monstrous breed suggestions become presets that fill in the choices.
- Basic moves: their own JSON file, shared by all playbooks, including the
  advanced versions that the "mark basic moves as advanced" improvement needs.
