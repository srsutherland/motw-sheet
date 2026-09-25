# Roadmap to MVP

Where the project stands and what's left before it's usable. Read this first
when picking the project back up; `playbook-schema-notes.md` covers the one
piece of real design work in depth.

Last checked against the code at `cfdb85f` (2026-09-24).

## MVP

One player, in one browser, can:

1. See their saved hunters on the home page.
2. Create a Spell-Slinger and land on its edit page.
3. Fill in the whole sheet (name, pronouns, look, ratings, Combat Magic,
   Tools & Techniques, moves, gear, history) with no `WIP` placeholders.
4. View it: everything filled in on the edit page shows up on the view page.
5. Play with it: track luck, harm, and experience, and level up by picking
   an improvement that actually applies.
6. Export it to a file and import it back.

Not MVP: the other 11 playbooks, a backend, anything shared between players
at a table, keeper tools.

## Decisions

| Decision | Status |
|---|---|
| **Spell-Slinger is the vertical slice**; other playbooks come after MVP. | Standing (2026-06-03). |
| **Design the playbook schema against all 12 playbooks up front**, even though only one ships, so adding the rest is data entry, not a renderer rewrite. | Standing (2026-06-03). See `playbook-schema-notes.md`. |
| **Routing is query-string based** (`?`, `?new`, `?view={id}`, `?edit={id}`), handled in `App.vue`. | Shipped (`d9ee956`). Replaces the June plan to adopt vue-router with path routes: GitHub Pages can't serve arbitrary paths. |
| **Persistence is localStorage, one key per hunter**, plus JSON file export/import. No backend. | Shipped (`src/Storage.js`). |
| **App name** stays "Monster of the Sheets" for now. | Deferred. Shortlist in `Name Ideas.md`. |

## Where things stand

**Done**
- Home page lists saved hunters with view and delete; import from file
  (`ActionList.vue`).
- New-hunter flow: pick a playbook, get an edit page (`NewHunter.vue`).
- Autosave on every change to the current hunter (`App.vue` watcher).
- Export to a JSON file from the view page (`ShowHunter.vue`).
- View page: ratings with their basic moves, luck/harm/experience tracks
  (shared `Track.vue`), gear, moves.
- All 12 playbooks transcribed to `playbooks/md/`; the Spell-Slinger is also in
  JSON (`playbooks/the-spellslinger.json`).

**Partial**
- **Edit page** (`EditHunter.vue`): name, ratings line, starter gear, and
  improvement checkboxes work. "Add Move" is a dead button (only "Add ALL"
  works). Look, History, Other Gear, and the playbook-specific section are
  `WIP` text. Combat Magic renders through `PreMove.vue`, which is a stub that
  prints "(Pre-move)".
- **Leveling up**: at 5 experience the "Level up" button just clears
  experience and bumps `level`. No improvement is chosen or applied.
  Improvements are instead free checkboxes on the edit page, and checking one
  doesn't do anything.

**Missing**
- Pronouns: every playbook has the field; neither `Hunter.js` nor the JSON do.
- The view page shows none of look, pronouns, Combat Magic, Tools & Techniques,
  history, or the Spell-Slinger's luck special.
- Basic move descriptions (needed for the hover popups in `DESIGN.md`);
  `BasicMoves.js` is names only.

## Problems to fix along the way

These are the ones that matter for planning. Most are resolved by the schema
work rather than patched individually.

- **Saved hunters embed a full copy of their playbook** (`hunter.playbook`).
  Fixes to the playbook JSON never reach existing hunters, and every save
  carries ~16 KB of playbook. Moves and gear are copied as whole objects too.
  Saved hunters also have no format version, so there's no way to migrate them
  when the schema changes. This is the most urgent item: every hunter saved
  in the current format needs migrating (or throwing away) once the schema
  changes.
- **Improvement ids are generated at runtime** from their description text, in
  the `Hunter` constructor, by mutating the shared imported playbook object.
  Rewording an improvement changes its id. Ids belong in the JSON.
- **`Hunter.stats` is dead**; the edit and view pages use `hunter.ratings`,
  which holds the chosen ratings line itself. Once improvements apply, current
  ratings should be computed as the chosen line plus applied improvements, not
  stored as edited numbers.
- **Gear ignores its pick limit** (checkboxes, "pick 1" not enforced).
- **Move sub-choices aren't captured.** Practitioner says "choose two effects";
  `Move.vue` can display `move.choices` but nothing ever sets it.
- **Data errors in `the-spellslinger.json`**: the first "Take a move from
  another playbook" improvement has `increase: "moves"` instead of
  `"moves_other"`; Combat Magic's "at least one base" is encoded as
  `"pick": ">1"`, which reads as "more than one".
- **`playbook.schema.json` doesn't enforce anything** (`additionalProperties:
  true` throughout) and nothing runs it.

## Remaining work, in order

### 1. Playbook schema and saved-hunter format

These are designed together because a hunter's saved state is its choices
recorded against the playbook's sections: one determines the other.

- Settle the section model and selection vocabulary against all 12 playbooks
  (`playbook-schema-notes.md` has the survey and a draft).
- Define the saved-hunter format: `playbook_id`, a format `version`, and
  choices keyed by section and option ids. Resolve the playbook at load time.
  Write a loader that upgrades or rejects old saves.
- Re-author `the-spellslinger.json` in the new shape, with authored ids for
  every section, option, and improvement. Fix the data errors above.
- Tighten `playbook.schema.json` to match, and add an `npm run validate` script
  that checks every playbook JSON against it.

**Done when:** the Spell-Slinger validates, and hand-written JSON for the
Expert, Monstrous, Chosen, and Wronged sections (the hardest cases) validates
too without any schema changes.

### 2. Edit page, driven by the schema

Build one generic renderer for selection sections and use it for everything
that's a choice: Combat Magic, Tools & Techniques, moves (including
sub-choices like Practitioner), gear, look.

- Enforce pick, cross-off, and group limits; show how many are left.
- Look: pick from each list or type your own.
- Pronouns and name.
- History: one entry per other hunter, with a free-text name, a pick from the
  playbook's history options, and notes. (`DESIGN.md` already says these are
  local strings, not links to other hunters.)
- "Other gear": free-text entries with optional tags.

**Done when:** a Spell-Slinger can be built completely with no `WIP` text, and
the renderer contains no Spell-Slinger-specific code.

### 3. View page completeness

- Render every section the edit page can set, in `DESIGN.md` order.
- Luck special text next to the luck track.
- Basic move descriptions as hover popups on ratings.

**Done when:** nothing entered on the edit page is missing from the view page.

### 4. Leveling up

- Level up opens an improvement picker (regular improvements; advanced
  improvements once five are taken). Remove the edit-page checkboxes.
- Apply improvement effects: rating increases (respecting `max`), extra
  picks in a section, luck recovery. Record specials such as change playbook
  and retire; they don't need to do anything yet.

**Done when:** taking "Get +1 Weird, max +3" changes the displayed Weird, and
"Take another Combat Magic pick" lets you make one more pick.

### 5. Polish

- Responsive column layout from `DESIGN.md`.
- Reconcile `DESIGN.md` with what shipped.
- Replace `confirm`/`alert` in `ActionList.vue` and `Storage.js` if they grate.
- Pick the app name; apply it to the header, `index.html`, `package.json`.

## After MVP

- Remaining 11 playbooks: transcribe markdown to JSON; renderer changes should
  not be needed if step 1 was done right.
- Share by URL (encode the hunter into a link). Only realistic once saves
  hold choice ids rather than copied text; measure the size then.

## Open questions

- Should `level` stay separate from the number of improvements taken, or be
  derived from it? The rules only count improvements (5 for advanced, 12 for
  mythic).
- Store as a composable around `Storage.js`, or introduce Pinia? Nothing so far
  argues for Pinia.
