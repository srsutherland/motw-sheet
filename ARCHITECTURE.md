# Architecture Overview

How the codebase is organized, for finding your way around quickly. Update it as the code evolves. Template: https://architecture.md/

## 1. Project Structure

```
motw-sheet/
├── src/                      # The app (Vue 3)
│   ├── components/           # Pages and UI components
│   │   ├── show/             # View page sections (tracks, ratings, moves, features...)
│   │   └── edit/             # Edit page sections
│   ├── App.vue               # Query-string router, autosave
│   ├── Hunter.js             # Hunter class, schema version, record builders
│   ├── HunterState.js        # Computed hunter state; editing choices; improvements
│   ├── HunterContext.js      # provide/inject for the current hunter
│   ├── PlaybookData.js       # Ids, paths, @ references
│   ├── Playbooks.js          # Loads the playbook JSON
│   ├── Storage.js            # localStorage, import/export
│   ├── Markdown.js           # Display-text markdown subset
│   └── Tags.js               # Gear tag parsing
├── playbooks/                # Playbook data (the-spellslinger, basic_moves)
├── sources/                  # Submodule, private (_motw-sources): PDFs, md
│   ├── pdf/                  # PDF handouts; books/ for full books
│   │   └── extracted/        # Raw PDF extractor output, one folder per PDF
│   ├── md/                   # Reference transcription of the PDFs
│   ├── html/                 # md rendered, to compare against the PDF
│   └── scripts/              # PDF extraction, md -> html (Python)
├── samples/                  # Sample hunter files (used by tests)
├── tests/                    # Engine and browser tests
├── res/                      # Styles, font, icon
├── plan/                     # Planning docs
├── .github/workflows/        # Deploy to GitHub Pages
├── AGENTS.md                 # Guidance for AI agents
├── DESIGN.md                 # Page/UI spec
└── ARCHITECTURE.md           # This document
```

## 2. High-Level System Diagram

```
playbooks/*.json ──> Playbooks.js ──> PlaybookData.js (ids, paths, @refs)
                                            │
Hunter (choices, stored) ──> HunterState.js (replays choices) ──> computed state ──> components
        │                                                                              │
        └──── Storage.js (localStorage, import/export, `computed` in saved files) <──┘ (autosave)
```

- A hunter stores only choices and plain values; ratings, moves, gear and features are computed by replaying `getting_started`, then each improvement in the order taken, then the choices on gained items
- The hunter keeps its own copy of its playbook ("full" format); references resolve against that copy first

## 3. Core Components

### 3.1. Frontend

Name: motw-sheet web app

Description: Create, view and edit *Monster of the Week* hunters. See `DESIGN.md`.

Technologies: Vue 3 (`<script setup>`), Vite, plain JavaScript

Deployment: GitHub Pages (see 6)

#### Modules (`src/`)

- `Playbooks.js`
   - Imports the playbook JSON files
   - `files`: file id (`the_spellslinger`, `basic_moves`) -> data
- `PlaybookData.js`
   - Auto ids, path index, `@` reference resolution
   - `optionsOf`: a container's options, each with its `written` form
   - Never mutates data; works on raw (non-reactive) objects
- `Hunter.js`
   - `Hunter` class, `SCHEMA_VERSION`
   - Record builders: `makeChoices`, `makeRecord`
   - `fromJSON`: rejects other versions, ignores `computed`
- `HunterState.js`
   - `hunterState(h)`: moves, features, gear, ratings, picks, cross-offs, advanced basic moves
   - Choice editing: `choiceSet`, `toggleChoice`, `setTextChoice`
   - Improvements: budget, disabled, availability, costs
- `HunterContext.js`
   - `provideHunter`, `useHunter`, `useHunterState`
- `Storage.js`
   - localStorage, one key per hunter
   - Import/export
   - `toSaved`: adds `updated`, `computed`; playbook last
- `Markdown.js`
   - Markdown subset for display text
   - Escapes everything first (imported files carry their own playbook text)
- `Tags.js`
   - Typed gear tags: "1 harm magic" -> `["1-harm", "magic"]`

#### Components (`src/components/`)

- `App.vue`: router (`?new`, `?view={id}`, `?edit={id}`; GitHub Pages can't serve other paths), autosave, `provideHunter`
- `ShowHunter.vue` + `show/`: view page; `Track.vue` is the generic box track (luck, harm, experience wrap it)
- `EditHunter.vue` + `edit/`: edit page
- `ChooseRule.vue`: renders any `choose` rule (options, limits, free text, nested choices); used by the edit page and the Advancement dialog
- `ImprovementPicker.vue` (Advancement dialog), `AdvancementButton.vue`, `HoverPopup.vue`, `MarkdownText.vue`

#### Patterns

- The hunter comes from `useHunter()`, not props. It's a ref: read `hunter.value` inside functions (`const h = hunter.value;`), never once at setup (the provider can swap hunters while a component stays mounted). A future Keeper view can provide a different hunter per subtree
- Edit choices through `HunterState.js` (`toggleChoice`, `setTextChoice`), not by mutating arrays in components
- Rules live on choices, not sections; a rule's hunter-side record is found with `choiceSet(record, holder, i)`

### 3.2. Backend Services

None: static site; everything runs in the browser.

## 4. Data Stores

Formats: see `plan/Schema Notes.md`.

### 4.1. Playbook JSON

Type: static JSON in `playbooks/`, bundled into the app

Purpose: the app's source of truth for playbook content. The PDFs are the ultimate source; `sources/md/` is a reference transcription of them. Game text comes from those, never from memory

Key files: `the-spellslinger.json`, `basic_moves.json`

Versions: `schema_version` (date of the last breaking change) and `updated`

### 4.2. Hunters

Type: browser localStorage, one key per hunter (`motw-sheet.hunter.{uid}`); JSON file import/export

Purpose: the user's hunters; nothing leaves the browser

Versions: `schema_version` in `src/Hunter.js`; other versions load as "old format" (delete only; migration is on the roadmap). Breaking changes: bump the version, convert `samples/`

## 5. External Integrations / APIs

None. (Google Drive sync: see `plan/Roadmap.md`.)

## 6. Deployment & Infrastructure

Hosting: GitHub Pages, base path `/motw-sheet/`

CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`; tests don't run there yet

Monitoring & Logging: none

## 7. Security Considerations

- No accounts, no server; data stays in the browser
- Imported hunter files are untrusted: they carry their own playbook copy, whose text is rendered as HTML. `Markdown.js` escapes everything first; render display text only through it (`MarkdownText.vue`)

## 8. Development & Testing Environment

Local Setup Instructions: see `README.md`

Testing Frameworks: `tests/engine.test.mjs` (real modules through Vite's `ssrLoadModule`); `tests/e2e/` (Playwright via `playwright-core`, driving an installed Edge or Chrome; `run.mjs` starts and stops the dev server); `tests/check.mjs` (assertions)

Code Quality Tools: ESLint with `@stylistic` and `eslint-plugin-vue` (formatting included; no Prettier). See `AGENTS.md`

## 9. Future Considerations / Roadmap

See `plan/Roadmap.md`.

## 10. Project Identification

Project Name: motw-sheet (working title; see `plan/Name Ideas.md`)

Repository URL: https://github.com/srsutherland/motw-sheet

Primary Contact/Team: Sean Sutherland (GitHub: @srsutherland)

Date of Last Update: 2026-10-16

## 11. Glossary / Acronyms

### Game terms

- **Hunter**: a player character
- **Keeper**: the GM
- **Playbook**: a character type (the Spell-Slinger, the Expert...); one sheet each
- **Ratings**: Charm, Cool, Sharp, Tough, Weird; added to rolls
- **Basic moves**: moves every hunter has, each rolled with a rating; "advanced" versions unlock through advanced improvements
- **Moves**: a playbook's own special abilities
- **Luck**: a track of marks, spent to change a roll or avoid harm; full = Doomed. Each playbook adds a luck *special*
- **Harm**: a track of injury, Okay to Dying; at 4+ the wound is *unstable*
- **Experience**: 5 boxes; filling them levels the hunter up
- **Improvement**: what a level up buys. *Advanced* improvements unlock after 5 level ups; *mythic* ones are homebrew (this app's) and cost more than one
- **Gear**: weapons and equipment, described by tags ("2-harm close loud")
- **Look**: appearance, picked from short lists or written in
- **History**: how the hunter knows each other hunter at the table

### Data terms

- **Feature**: a playbook-specific thing that isn't a move (Combat Magic, Haven); shown before or after moves (pre-moves / post-moves)
- **Options**: what the playbook offers to choose from
- **`choose`**: a rule on a playbook object: `from` (where to choose) + one verb (`pick`, `cross`, `remove`) and its count
- **Chosen**: what the hunter picked, stored with the `choose` rule's object
- **Selected**: computed, on the object that has the options, from any source
- **`id` / `ref`**: `id` defines something (playbook); `ref` points at it (hunter). A reference with nothing attached is just its string
- **`@` reference**: a path of ids (`@combat_magic.bases.blast`); relative to its container or playbook root unless the first segment is a file id; `@this`: the object it's written in
- **`@textbox`**: a free-text option
- **`getting_started`**: character creation, in the same shape as an improvement (`grant` + `choose`)
- **Record**: the hunter's side of a playbook object: a reference, or `{ ref, chosen }` / `{ from, chosen }`
- **Full / slim**: hunter files with the whole playbook copy / references only (slim not built)
- **`computed`**: what the sheet shows, saved for readers of the file; ignored on load
- **`schema_version`**: the date of the last breaking format change

See also: `plan/Schema Notes.md` (data terms in depth), the *Monster of the Week* rules and `sources/md/` (game terms).
