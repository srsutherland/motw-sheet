# Playbook schema notes (Phase 1 design work)

> Why this exists: only the Spell-Slinger ships at MVP, but the JSON schema and
> the Vue renderer that consumes it must be designed so the *other 12* playbooks
> drop in later without a rewrite. The Spell-Slinger is one of the more regular
> playbooks — the outliers below are what break naive assumptions.
> Source data: `playbooks/md/*.md` (all 13 extracted from the rulebook PDF).
> Last updated: 2026-06-03.

## The core tension

Today's `the-spellslinger.json` uses **bespoke top-level keys** for its special
content: `pre_moves` (Combat Magic), `moves.you_get` (Tools & Techniques),
`moves.children` (the pick-three). A renderer written against those keys is
implicitly a Spell-Slinger renderer. The other playbooks have *differently
named, differently shaped* special sections, so the real decision is:

- **Option A — bespoke keys per playbook** (status quo). Each playbook invents
  its own keys; the renderer special-cases them. Fast for one playbook, O(n)
  pain for thirteen, and improvements can't generically target sections.
- **Option B — a generic recursive "sections" model** (recommended). A playbook
  is an ordered list of typed, id'd selection blocks. The renderer recurses over
  block `type`/`opt_type`. Improvements reference blocks by `id`. More design up
  front, but every new playbook is *data*, not code.

The recommendation is **Option B**, and Phase 1's acceptance test is: can we
express the Expert and the Monstrous (below) in it with no gaps?

## Structural variety survey (the things that must fit)

### 1. Playbook-specific "special" sections are not uniform
- **Spell-Slinger:** *Combat Magic* — pick 3 from two groups (Bases, Effects)
  with a constraint "at least one Base". Plus *Tools & Techniques* — cross off 1
  of 4.
- **Expert:** *Haven* — pick 3 of 9 options. A whole subsystem with its own id.
- **Monstrous:** *Monster Breed* — pick 1 Curse of 4; **and** *Natural Attacks*
  — "pick a Base and add an Extra, **or** two Bases" (a compound either/or rule);
  **and** *Monster Breed Suggestions* — a reference table, not interactive.

Takeaway: model these as a list of **sections**, each `{ id, heading,
description, opt_type, options, constraint? }`. `pre_moves` should generalize to
"sections that render before the moves block" — position is a layout concern,
not a type.

### 2. Selection rules vary and need a principled representation
Observed `opt_type`s and rules:
- `pick N` (moves: pick 3; Haven: pick 3; Curse: pick 1).
- `cross N` (Tools & Techniques: cross 1).
- `input` (Look: choose from list **or** type your own).
- **pick-one-from-each-of-several-lists** (Look has 2 lists for Spell-Slinger,
  **3** for the Monstrous).
- **constrained pick** ("pick 3 with at least one Base") — currently hacked as
  `"pick": ">1"` (a string). Needs a real `constraint`/`min`/`group` concept.
- **compound either/or** (Natural Attacks: "a Base + an Extra, OR two Bases").
  This is the hardest; may warrant a `rule` expression or an explicit
  enumeration of valid shapes.

### 3. Improvements are a mini-DSL targeting section IDs (sometimes cross-playbook)
Current fields: `increase` / `decrease` / `special` / `amount` / `max`, keyed to
ids like `combat_magic_picks`, `tools_and_techniques_cross_offs`, `luck_used`.
New cases the schema must support:
- Expert: "Add an option to your haven" → `increase: "haven_options"`.
- Monstrous: "Take a natural attacks pick" → `increase: "natural_attacks"`;
  **"Gain a haven, like the Expert has, with two options"** → an improvement that
  *instantiates a section borrowed from another playbook*.
- `special` actions already present: `change_playbook`, `second_hunter`,
  `retire`, `advanced_moves`, `any_rating`.

Implication: every selectable section needs a **stable, app-wide id** so an
improvement (even one defined in another playbook) can target it. Consider a
shared registry of canonical section ids (`haven`, `natural_attacks`, …) rather
than per-playbook ad-hoc strings.

### 4. Display-only / reference content
"Monster Breed Suggestions" (Monstrous) and "Basic Moves by Rating" (most
playbooks) are read-only. The schema needs a non-interactive block type so these
render without being mistaken for selections.

### 5. Variable counts where the current schema assumes fixed
- **Look** lists: 2 vs 3 (and each ends with a free-input "____").
- **Gear** `pick`: Spell-Slinger picks 1; Expert picks 3 monster-slaying
  weapons; Monstrous takes 0-or-1 ("if you want"). So gear is just another
  pick-N section, not special.
- **Ratings**: uniform (5 lines of the 5 stats) — this one's safe as-is.

## Concrete schema directions to evaluate in Phase 1
1. Replace `pre_moves` / `moves.you_get` / `moves.children` with a single
   ordered `sections: [Section]` where `Section.kind ∈ {select, reference,
   moves, gear, look, ratings, history, introductions, improvements}`.
2. Give every `select`-kind section an `id`, `opt_type`, `pick`/`cross`/min, and
   an optional `groups` (for Bases/Effects) + `constraint`.
3. Define an `improvement` target vocabulary tied to those `id`s, plus the
   `special` verbs already in use.
4. Keep `the-spellslinger.json` as the reference implementation and re-author it
   to the new shape; keep `playbook.schema.json` in lockstep (it's currently
   `additionalProperties: true` everywhere, so it permits but doesn't *enforce*
   structure — tighten it as the model firms up).

## How this maps to the hunter's *saved state*
Separate the **playbook definition** (immutable template) from the **hunter
instance** (the player's choices). The hunter should store *references/ids* into
the playbook's sections (which option(s) picked, which boxes crossed, free-text
inputs), not copies of descriptions. `Hunter.js` currently pushes whole move
objects into `hunter.moves` (see `addAllMoves`) — revisit so saved hunters store
ids and rehydrate against the playbook. This matters for both localStorage size
and for export/share encoding (Phase 4).
