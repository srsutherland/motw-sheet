# Architecture

How the code is organized. For the data formats themselves, see `plan/Schema Notes.md`.

## Data flow

```
playbooks/*.json ──> Playbooks.js (library) ──> PlaybookData.js (ids, paths, @refs)
                                                     │
Hunter (choices, stored) ──> HunterState.js (replays choices) ──> computed state ──> components
        │                                                                               │
        └──── Storage.js (localStorage, import/export, adds `computed` to saved files) <──┘ (autosave)
```

- A **hunter** stores only choices and plain values (`src/Hunter.js`). Ratings, moves, gear and features are **computed** (`src/HunterState.js`) by replaying `getting_started`, then each improvement in the order taken, then the choices on gained items.
- The hunter keeps its own copy of its playbook (the "full" format); references resolve against that copy first.

## Modules (`src/`)

| File               | Role |
| ------------------ | --- |
| `Playbooks.js`     | Imports the JSON files; `files` maps file id (`the_spellslinger`, `basic_moves`) to data |
| `PlaybookData.js`  | Auto ids, path index, `@` reference resolution, `optionsOf` (a container's options, each with its `written` form). Never mutates data; works on raw (non-reactive) objects |
| `Hunter.js`        | The `Hunter` class, `SCHEMA_VERSION`, record builders (`makeChoices`, `makeRecord`), `fromJSON` (rejects other versions, ignores `computed`) |
| `HunterState.js`   | `hunterState(h)` (moves, features, gear, ratings, picks, cross-offs, advanced basic moves), choice editing (`choiceSet`, `toggleChoice`, `setTextChoice`), improvements (budget, disabled, availability, costs) |
| `HunterContext.js` | `provideHunter` / `useHunter` / `useHunterState` (provide/inject) |
| `Storage.js`       | localStorage (one key per hunter), import/export, `toSaved` (adds `updated`, `computed`, playbook last) |
| `Markdown.js`      | The display-text markdown subset; escapes everything first (imported files carry their own playbook text) |
| `Tags.js`          | Parses typed gear tags ("1 harm magic" -> `["1-harm", "magic"]`) |

## Components (`src/components/`)

- `App.vue`: query-string router (`?new`, `?view={id}`, `?edit={id}`; GitHub Pages can't serve other paths), autosave, `provideHunter`
- `ShowHunter.vue` + `show/`: the view page; `Track.vue` is the generic box track (luck, harm, experience wrap it)
- `EditHunter.vue` + `edit/`: the edit page
- `ChooseRule.vue`: renders any `choose` rule (options, limits, free text, nested choices); used by the edit page and the Advancement dialog
- `ImprovementPicker.vue` (the Advancement dialog), `AdvancementButton.vue`, `HoverPopup.vue`, `MarkdownText.vue`

## Patterns

- **The hunter comes from `useHunter()`, not props.** It returns a ref: use `hunter.value` inside functions (`const h = hunter.value;`), never once at setup, because the provider can swap hunters while a component stays mounted. Templates use plain `hunter`. A future Keeper view can provide a different hunter per subtree.
- **Edit choices through `HunterState.js`** (`toggleChoice`, `setTextChoice`), not by pushing onto arrays in components.
- **Rules live on choices, not sections.** A `choose` rule's hunter-side record is found with `choiceSet(record, holder, i)`.

## Tests (`tests/`)

- `engine.test.mjs`: loads the real modules through Vite (`ssrLoadModule`) and checks the data layer and hunter state
- `e2e/*.test.mjs`: Playwright (`playwright-core`) against the dev server, which `e2e/run.mjs` starts and stops; uses `samples/`
- `check.mjs`: minimal PASS/FAIL assertions
