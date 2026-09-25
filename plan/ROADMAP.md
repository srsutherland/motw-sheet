# Roadmap to MVP

> Master planning doc. Captures the current state, the decisions made, and the
> phased path to a usable MVP. Read this first when picking the project back up.
> Last updated: 2026-06-03.

## What "MVP" means here

A single player can, **on one device and in the browser**, do the full loop:

1. Land on a home page that lists their saved hunters.
2. Create a new hunter (Spell-Slinger only at MVP) and be taken to its edit page.
3. Fill the sheet out completely — ratings, look, moves, gear, combat magic,
   history — with every section functional (no `WIP` stubs).
4. Save it. It **persists across refreshes** (localStorage).
5. Re-open it later from the home page, view it, and edit it again.
6. **Export/share** the hunter (encoded URL and/or JSON file) and import it back.

Out of scope for MVP: the other 12 playbooks (data only — see Phase 1), a
backend, real-time multiplayer tables, keeper tools.

## Decisions made (2026-06-03)

These are choices that aren't derivable from the code. Honor them unless we
explicitly revisit.

| Decision | Choice | Why |
|---|---|---|
| **Persistence** | localStorage **+ shareable export/import** (encoded URL or JSON file). No backend. | MotW is a table game, but a backend is too much for MVP. Export covers "share with your table" without a server. |
| **Routing** | Adopt **vue-router with per-hunter IDs** (`/`, `/new`, `/{id}`, `/{id}/edit`), matching DESIGN.md. | Bookmarkable sheets, real home page, aligns code with the documented design. Replaces the current in-memory view-switching. |
| **Playbook scope** | **Spell-Slinger is the MVP vertical slice.** Convert the other 12 afterward. | Prove the full create→edit→save→show→share loop on one playbook first. |
| **Playbook schema** | **Design the JSON schema + renderer up front against the structural outliers** (Expert's Haven, Monstrous's Breed/Natural Attacks), even though only Spell-Slinger ships. | If the renderer assumes Spell-Slinger's shape, adding the rest later forces a rewrite. See `playbook-schema-notes.md`. This is the riskiest design work — do it early. |
| **App name** | Keep placeholder "Monster of the Sheets". Defer. | Naming shouldn't block MVP. Shortlist lives in `Name Ideas.md`. |

## Current state (snapshot 2026-06-03)

Vue 3 + Vite. No router, no persistence, no tests. `App.vue` swaps four views
(`action`/`new`/`edit`/`show`) via a `currentView` ref.

**Working:**
- `ShowHunter.vue` (read view) is the most complete — renders ratings, luck,
  harm, experience, gear, moves via `src/components/show/*` subcomponents.
- `Hunter.js` data model + a rich playbook JSON schema
  (`playbooks/the-spellslinger.json`, validated by `playbook.schema.json`).
- PDF→markdown pipeline (`scripts/extract_playbooks_from_pdf.py`) has already
  produced all 13 playbooks as markdown in `playbooks/md/`.

**Gaps (the work):**
1. **No persistence.** Nothing uses localStorage. Refresh loses everything.
2. **Only Spell-Slinger is wired in** (`src/Playbooks.js` imports one JSON).
   The other 12 are markdown only, not converted to the JSON schema.
3. **Edit flow is stubbed** (`EditHunter.vue`): "Add Move" does nothing; Look,
   History, "Other Gear" are `WIP` placeholders. `PreMove.vue` renders the
   literal text "(Pre-move)".
4. **Landing page is a dead end** (`ActionList.vue`): only "New Playbook". No
   list/load/edit of existing hunters.
5. **`DESIGN.md` describes the target** (routed, multi-hunter) but the code
   diverges (in-memory views, no IDs). The roadmap below closes that gap.

## Phased plan

Ordering rationale: de-risk the schema first (Phase 1), then stand up the
skeleton that everything hangs off (persistence + routing, Phase 2), then fill
in the edit flow (Phase 3), then sharing (Phase 4), then polish (Phase 5).
Phase 1 can overlap with Phase 2 since they touch different files.

### Phase 1 — Lock the playbook data architecture *(do first; highest design risk)*
- Survey the structural variety across all 13 playbooks (started in
  `playbook-schema-notes.md`).
- Decide: **generic recursive "sections" model** vs. today's bespoke per-key
  shape (`pre_moves`, `moves.you_get`, …). Validate the choice by sketching how
  the Expert's Haven and the Monstrous's Breed/Natural Attacks would serialize
  and render under it.
- Nail down the **improvement-target ID convention** (improvements reference
  sections by id, sometimes across playbooks — "gain a haven like the Expert").
- Output: an updated `playbook.schema.json` + a re-authored
  `the-spellslinger.json`, plus written rules in `playbook-schema-notes.md`.
- Acceptance: a paper exercise mapping Expert + Monstrous onto the new schema
  with no "this doesn't fit" gaps.

### Phase 2 — Skeleton: persistence + routing
- Add `vue-router`; routes `/`, `/new`, `/{id}`, `/{id}/edit`. Retire the
  `currentView` ref in `App.vue`.
- A `hunters` store (Pinia or a small composable) backed by localStorage:
  list, get(id), save(hunter), delete(id). Hunter `uid` already exists.
- Home page (`/`) lists saved hunters with view/edit/delete; "New" → `/new`.
- Serialize/deserialize `Hunter` correctly (it's a class with methods — store
  plain data, rehydrate via constructor or a `fromJSON`).
- Acceptance: create a hunter, refresh, it's still listed and openable.

### Phase 3 — Finish the edit flow (Spell-Slinger complete)
- **Add Move** picker: modal/popover listing available playbook moves, respect
  pick limits, prevent duplicates (the `addAllMoves` helper shows the shape).
- **Look**: choose-from-list + free input per look category.
- **History**: relationship entries (DESIGN.md §/{id}/edit.8). For MVP without a
  shared table, allow free-text "other hunter" names + the playbook's options.
- **Combat Magic / pre-moves**: replace the `PreMove.vue` stub with a real
  selector driven by the schema from Phase 1.
- **Gear**: finish "other gear" beyond the starter pick.
- Acceptance: a Spell-Slinger sheet can be fully built with zero `WIP` text.

### Phase 4 — Share / export-import
- Export hunter → JSON file download **and** an encoded shareable URL
  (e.g. base64+compress of the hunter data, opened via a `/import?d=...` route).
- Import → validate → save into the local store.
- Acceptance: export a hunter, open the link/file in a fresh browser profile,
  see the same hunter.

### Phase 5 — Polish & reconcile
- Reconcile `DESIGN.md` with what shipped (routes, sections).
- Update `README.md` (currently the Vite boilerplate `src/README.md` leftover).
- Advancement/leveling UI when experience hits 5 (improvements already modeled).
- Responsive columns per DESIGN.md; basic-moves hover popups on ratings.
- Decide the app name; apply to header/`index.html`/`package.json`.

## Open questions (decide when reached)
- Store: Pinia vs. a hand-rolled composable? (Lean composable — small app.)
- URL-share encoding: how big do encoded hunters get? May need lz-string.
- History across a real table is a post-MVP backend concern — confirm the MVP
  free-text stand-in is acceptable when we get to Phase 3.

## Related docs
- `DESIGN.md` — target UX/spec (vision; code currently diverges).
- `plan/playbook-schema-notes.md` — deep dive on the schema (Phase 1).
- `plan/Name Ideas.md` — naming shortlist (deferred).
