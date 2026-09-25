Working notes on the playbook data design (not a schema file). See `Playbook Survey.md` for what the 12 playbooks need.

Sections: **Decided** (with where it was decided), **Needs** (from the playbook data), **Proposals** (not yet discussed; don't treat as decided), **Open questions**.

# Decided

## Layout

- Section order is set by the renderer, matching the paper sheet (DESIGN.md)
   - Fixed areas, including "pre-moves" and "post-moves" for playbook-specific sections
   - Each area is ordered within
   - e.g. Combat Magic is a pre-move section; the Expert's Haven is a post-move section

## Ids and references

- Ids auto-assigned by default (from the name); an explicit `"id"` overrides
- Scoped with dots: `the_expert.haven`, `the_spellslinger.combat_magic.fire`
   - Scoped and unscoped forms: `@haven` within the Expert, `@the_expert.haven` from anywhere
- References are prefixed with `@` to distinguish them from ids: `"from": "@combat_magic"`

## Sections and choices

- Sections are lists of options; selection rules live on the choices that pick from them, not on the sections
- Character creation is "level 0": a list of choices, in the same shape as improvements

```jsonc
"level_0": [
  { "choose": { "from": "@ratings_base", "pick": 1 } },
  { "choose": { "from": "@combat_magic", "pick": 3, "groups": { "bases": { "min": 1 } } } },
  { "choose": { "from": "@tools_and_techniques", "cross": 1 } },
  { "choose": { "from": "@moves", "pick": 3 } },
  { "choose": { "from": "@gear_base", "pick": 1 } }
]
```

- Every pick has a source: level 0, or a specific improvement
- Picks are shown inside the section they're picked from, whatever their source (needs extra logic to merge)

## Selection rules

Options on `choose` (exact syntax not final):

| Rule                                                  | Covers |
| ----------------------------------------------------- | --- |
| `"pick": 3`                                           | most choices |
| `"min": 1`, `"min": 2`                                | "one or more" (Wronged), "at least two" (Heat) |
| `"min": 0, "pick": 1`                                 | optional gear |
| `"cross": 1`                                          | Tools & Techniques |
| per-group counts: `"groups": { "form": 1, "end": 3 }` | Chosen weapon, most gear, heroic/doom tags, Professional armour |
| total + per-group min/max                             | Combat Magic (3, at least 1 base), Monstrous natural attacks (2, at least 1 base, at most 1 extra) |

## Free text

- A free-text entry is an option like any other: `@textbox`, inline with the rest (look, Chosen material)
- Once filled in: `{ "id": "@textbox", "text": "weary" }`

## Ratings

- Playbooks have `ratings_base`; the hunter picks one at level 0
- Current ratings are computed in `Hunter` (the chosen base + improvements), not stored
- Remove `h.stats`

## Gear

- `gear_base`: picked at level 0, limits enforced
- Then free additions to the gear list

## Improvements

- Either a pre-determined effect, or a reference to a list to choose from (DESIGN.md)
- The choice is made on, and stored with, the improvement (DESIGN.md)
- Chosen in a popup, or a dropdown if simple (DESIGN.md)
- "Get an X like the Y has" is a generic reference into another playbook, not a special case
   - The haven belongs to the Expert; others reference `@the_expert.haven`
- Specials that cost more than one improvement: ignore for now
- Redo / remove improvements: implementation detail, not a design question

```jsonc
{ "id": "combat_magic_pick", "text": "Take another Combat Magic pick",
  "choose": { "from": "@combat_magic", "pick": 1 } }

{ "text": "Gain a haven, like the Expert has, with two options",
  "choose": { "from": "@the_expert.haven", "pick": 2 } }
```

## Rules enforcement

- Complete: the app enforces the rules, doesn't just warn

## Text

- Display text is markdown, plus `[[wikilinks]]` to game terms and `<span class='...'>` (DESIGN.md)

## Hunter JSON

- "Full" version (objects serialized all the way down) and "slim" version (references where possible) (DESIGN.md)
   - Full: the hunter keeps its own copy of the playbook, modifiable
   - Slim: needs a stable id on everything it references
- Schema version number; 0.1 for now (DESIGN.md)
- Level is separate from improvements taken (DESIGN.md)

## Other content

- Basic rules content (basic moves, tag meanings, changing playbooks, etc.) gets its own JSON files, like playbooks

# Needs

From the playbook data (see `Playbook Survey.md`):

- Options with tags (gear, combat magic)
- Options with their own nested choice (Underworld, Practitioner, Artifact)
- Options with a blank to fill in (Heat, Who You Lost, curses with a substance)
- Groups within a section (Combat Magic bases/effects, heroic/doom tags, gear categories)
- Granted moves before the picks (Chosen, Initiate, Professional, Spell-Slinger, Wronged)
- Moves that change ratings (Unfazeable, Deal with the Devil)
- Improvements that redo or remove an earlier choice (Divine, Spooky, Wronged, Professional, Chosen)
- Compound improvements (Monstrous: curse no longer applies *and* -1 Weird)
- Narrative-only improvements (an ally, a stash of money)

Current JSON and code, to fix:

- Improvement ids are generated at runtime from description text (rewording one changes its id)
- Improvements point at pseudo-ids (`moves`, `moves_other`, `any_rating`, `advanced_moves`) instead of list references
- Selection limits live on the sections (`pick`) instead of on level-0 choices
- `Hunter` stores ratings instead of computing them; `h.stats` is dead

# Proposals

Not discussed yet. From the old draft (plan-slop) or from me.

- Section shape: `{ id, heading, description, options | groups }`
- Fixed effects as a list: `"effects": [ { "rating": "weird", "add": 1, "max": 3 } ]`
   - Compound improvements = multiple effects
- Something granted without a choice: `{ "grant": "@..." }`
   - Granted moves at level 0 (Spell-Slinger's Tools and Techniques)
   - A specific option from another playbook (Spooky: `@the_expert.haven.mystical_library`)
- Narrative-only improvements and specials (change playbook, second hunter, retire) are just recorded

# Open questions

- Options with a blank (Heat, Who You Lost): an option plus a `@textbox`? Different from a standalone `@textbox` option
- "A move from another playbook": `@*.moves`? Requires every playbook's move list to share the id `moves`
   - Loading a playbook may mean loading the playbooks it references
   - Before the other 11 playbooks exist in JSON?
- Unscoped references: resolve innermost scope first (section, then playbook)?
- Initiate gear depends on the Sect's traditions: conditional rule, or the player picks which gear rule applies?
- Monstrous breed suggestions: presets that fill in choices?
