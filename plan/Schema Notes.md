Working notes on the playbook data design (not a schema file). See `Playbook Survey.md` for what the 12 playbooks need, and `playbooks/proposal/the-spellslinger.json` for the Spell-Slinger written to these notes.

Sections: **Decided** (with where it was decided), **Needs** (from the playbook data), **Proposals** (not yet discussed; don't treat as decided), **Open questions**.

# Decided

## Principle

- The data's structure follows the paper playbook as closely as possible
   - Tiebreaker for naming and structure questions

## Layout

- Section order is set by the renderer, matching the paper sheet (DESIGN.md)
   - Fixed areas, including "pre-moves" and "post-moves" for features
   - Each area is ordered within
   - e.g. Combat Magic is a pre-move feature; the Expert's Haven is a post-move feature

## Terms

- **Feature**: a playbook-specific thing that isn't a move (Haven, Combat Magic, Background, Fate, Heat, Agency, Breed); goes in pre-moves or post-moves
- **Options**: what the playbook offers
- **Choices**: what the hunter picked
- Objects get an explicit `"type"`: `move`, `gear`, `feature`, `improvement`, etc.
   - Plain values (look, ratings lines, history) are implicitly typed by their key

## Ids

- Auto-assigned by default (from the name); an explicit `"id"` overrides
- Things without a name: case by case
- Improvement ids: explicit, short, unique across *all* improvement lists (not just within one)
   - e.g. `more_combat_magic`, `more_combat_magic_2`, `advanced_basic_1`, `cross_off_tt`
   - Mythic improvements are prefixed `mythic_`
- Plain values (look, ratings lines, history) have no ids: they're copied into the hunter in full, even in the slim version

## References

- Prefixed with `@` to distinguish them from ids
- Scoped with dots: `the_expert.haven`, `the_spellslinger.combat_magic.fire`
   - Paths follow ids, not JSON keys (no `.options.` step)
- Resolved from the playbook root: `@combat_magic` means this playbook's `combat_magic`, wherever it's written
   - (For now; revisit if it causes problems)
- `@this`: the object the reference is written in
- A known first segment makes a reference absolute: playbook ids (`the_*`), `basic_moves`, `shared`
   - `@the_expert.haven`, `@basic_moves.use_magic.heal`

## Getting started

- Character creation is `getting_started` (as on the paper playbook), in the same shape as improvements: `grant` + `choose`
- For moves and features (the things improvements can add to), plus starting gear
   - Look, ratings, history are not in `getting_started`; they have their own logic
- Every choice has a source: `getting_started`, or a specific improvement
- The choice is stored with its source
- A hunter's state = `getting_started`, then each improvement **in the order taken**

## Choosing

- `"from"` takes a container (a feature, or an option with its own options) and offers its options
   - One form only; no explicit `.options`
- `"grant"` takes the thing itself: you gain it
- `"choose"` can be a list, for improvements that do more than one thing
- One verb per `choose`; the hunter's stored choices are plain ids, their meaning comes from the verb:

| Verb     | Meaning                                    | Choosing from |
| -------- | ------------------------------------------ | --- |
| `pick`   | add it                                     | the container's options |
| `cross`  | strike it out; stays visible, crossed off  | the container's options |
| `remove` | undo an earlier pick                       | the hunter's current picks from that container |

- A choice that belongs to a move or feature lives on that move or feature (`"from": "@this"`)
   - Gaining it, from `getting_started`, a grant, or an improvement, triggers the choice
   - e.g. Practitioner, Tools and Techniques, Arcane Reputation

```jsonc
// on the Tools and Techniques move
{ "choose": { "from": "@this", "cross": 1 } }

// Divine: change your mission (redo = remove + pick)
{ "choose": [
    { "from": "@mission", "remove": 1 },
    { "from": "@mission", "pick": 1 } ] }

// Flake: gain a haven
{ "description": "Gain a haven, like the Expert has, with two options",
  "grant": "@the_expert.haven",
  "choose": { "from": "@the_expert.haven", "pick": 2 } }
```

## Display-only sub-items

- Sub-items that aren't chosen when building the hunter (Could've Been Worse: Fizzle / This Is Gonna Suck, chosen during play) go under a sub-key, not `options`
   - Key name case by case; `details` for Could've Been Worse

## Placement

- A picked or granted item goes where its `type` says, not where it was picked from
   - Every move goes in `Hunter.moves`, whichever playbook it's from
   - A feature goes in its area (pre-moves / post-moves), as in its home playbook
- Choices from a feature's options are shown inside that feature, whatever their source (needs extra logic)
- "Get an X like the Y has" is a generic reference into another playbook, not a special case
   - The haven belongs to the Expert; others reference `@the_expert.haven`

## Selection rules

Limits on a `choose` (exact syntax not final):

| Rule                                    | Covers |
| --------------------------------------- | --- |
| `"pick": 3`                             | most choices |
| `"min": 1`, `"min": 2`                  | "one or more" (Wronged), "at least two" (Heat) |
| `"min": 0, "pick": 1`                   | optional gear |
| `"cross": 1`                            | Tools & Techniques |
| limits per sub-list, keyed by reference | Combat Magic (3, at least 1 base), Monstrous natural attacks (2, at least 1 base, at most 1 extra), gear categories |

- A feature with sub-lists is one container: Combat Magic's options are two sub-lists, `bases` and `effects`

```jsonc
{ "choose": { "from": "@combat_magic", "pick": 3,
              "limits": { "@combat_magic.bases": { "min": 1 } } } }
```

## Free text

- A free-text entry is an option like any other: `@textbox`, inline with the rest (look, Chosen material)
- Once filled in: `{ "id": "@textbox", "text": "weary" }`
- Each `@textbox` is picked at most once; for several entries, list it several times (Arcane Reputation: three)

## Look, ratings, history

- Plain values, not objects: strings (look, history) and rating lines
- `heading` is a special key name (e.g. next to the `clothes` and `eyes` lists in `look`); restructure if it causes problems in code
- No ids; copied into the hunter in full
- Their own logic, not `getting_started`
- History options are pre-fills; the hunter can edit them freely

## Ratings

- Playbooks have `ratings_base`
- Current ratings are computed in `Hunter` (the chosen base + improvements), not stored
- Remove `h.stats`

## Gear

- `starting_gear`: chosen in `getting_started` (so it can be revised later), limits enforced
- Gear gets its own logic: arbitrary gear can be added as play goes on

## Improvements

- Either a pre-determined effect, or a reference to a list to choose from (DESIGN.md)
- The choice is made on, and stored with, the improvement (DESIGN.md)
- Chosen in a popup, or a dropdown if simple (DESIGN.md)
- Specials that cost more than one improvement: ignore for now
- Redo / remove improvements: implementation detail, not a design question
- "+1 to any rating": sub-options, one per rating, each a fixed effect; `"choose": { "from": "@this", "pick": 1 }`
   - Long term, DRY it to `"from": "@shared.improve_any_rating"`
- "Mark two basic moves as advanced": a pick plus an effect, `advance_basic`
- Advanced improvements unlock at level 5 (the paper: "after you have leveled up five times"): `"requires": { "level": 5 }`
- Mythic improvements are **homebrew**: not on the paper playbook

## Rules enforcement

- Enforced where applicable, with escape valves: individual options to bend or skip rules
   - e.g. saving and viewing a hunter doesn't require every choice to be made

## Text

- Display text is markdown, plus `[[wikilinks]]` to game terms and `<span class='...'>` (DESIGN.md)
- Wikilinks whose text differs from the term use a pipe: `[[manipulate someone|manipulate]]` (target, then displayed text)

## Hunter JSON

- "Full" version (objects serialized all the way down) and "slim" version (references where possible) (DESIGN.md)
   - Full: the hunter keeps its own copy of the playbook, modifiable
   - Slim: needs a stable id on everything it references
- Schema version number; 0.1 for now (DESIGN.md)
- Level is separate from improvements taken (DESIGN.md)

## Other content

- Basic rules content (basic moves, tag meanings, changing playbooks, etc.) gets its own JSON files, like playbooks
   - Referenced as `@basic_moves...`; e.g. Practitioner's options are `@basic_moves.use_magic.*` (use magic's effects)
- `shared`: content reused across playbooks (e.g. `@shared.improve_any_rating`)

# Needs

From the playbook data (see `Playbook Survey.md`):

- Options with tags (gear, combat magic)
- Options with their own nested choice (Underworld, Practitioner, Artifact)
- Options with a blank to fill in (Heat, Who You Lost, curses with a substance)
- Sub-lists within a feature (Combat Magic bases/effects, heroic/doom tags, gear categories)
- Granted moves before the picks (Chosen, Initiate, Professional, Spell-Slinger, Wronged)
- Moves that change ratings (Unfazeable, Deal with the Devil)
- Improvements that redo or remove an earlier choice (Divine, Spooky, Wronged, Professional, Chosen)
- Compound improvements (Monstrous: curse no longer applies *and* -1 Weird)
- Narrative-only improvements (an ally, a stash of money)

Current JSON and code, to fix:

- Improvement ids are generated at runtime from description text (rewording one changes its id)
- Improvements point at pseudo-ids (`moves`, `moves_other`, `any_rating`, `advanced_moves`) instead of references
- Selection limits live on the sections (`pick`) instead of on `getting_started` choices
- `Hunter` stores ratings instead of computing them; `h.stats` is dead

# Proposals

Not discussed yet. From the old draft (plan-slop) or from me.

- Feature shape: `{ id, type, name, description, heading, options }`
- Fixed effects as a list: `"effects": [ { "rating": "weird", "add": 1, "max": 3 } ]`
   - Compound improvements = multiple effects
   - Erase a used luck mark: `{ "luck": -1 }`
   - Advance basic moves: `{ "advance_basic": true }`, applying to the improvement's own picks
- Narrative-only improvements and specials (change playbook, second hunter, retire) are just recorded: `"special": "retire"`
- Mythic unlock: `"requires": { "improvements": 12 }` (plus the Keeper's say-so)
- Look lists: `{ "format": "___ clothes", "options": [...] }`

# Open questions

- `"type"` on every object, or only on things that can be placed on a hunter (not on options inside a feature or move)?
- A removed choice: gone, or still visible and crossed out?
- Options with a blank (Heat, Who You Lost): an option plus a `@textbox`? Different from a standalone `@textbox` option
- "A move from another playbook": `@*.moves`?
   - Loading a playbook may mean loading the playbooks it references
   - Before the other 11 playbooks exist in JSON?
- Initiate gear depends on the Sect's traditions: conditional rule, or the player picks which gear rule applies?
- Monstrous breed suggestions: presets that fill in choices?
