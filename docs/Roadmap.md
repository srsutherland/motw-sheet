Rough order of work. The schema grows out of building the Spell-Slinger; `Schema Notes.md` and `Playbook Survey.md` are for discussion along the way, not a spec to finish first.

# 1. MVP

Status: built on `spellslinger-mvp` (2026-10-02), awaiting review. All six points below work and were checked in a browser.

One player, in one browser, can:

1. See their saved hunters on the home page
2. Create a Spell-Slinger and land on its edit page
3. Fill in the whole sheet, no `WIP` placeholders
4. View it: everything set on the edit page shows on the view page
5. Play it: luck, harm, experience; level up by picking an improvement that applies
6. Export to a file and import it back

Rough order:

1. Edit page: the Spell-Slinger's selection sections
   - Combat Magic, Tools & Techniques, moves (incl. sub-choices like Practitioner), gear
   - Enforce limits; show how many picks are left
   - Aim for generic rendering, but don't block on it
2. Edit page: the rest of the sheet
   - Pronouns
   - Look: pick from each list or type your own
   - History: name, option, notes per other hunter
   - Other gear: free text + optional tags
3. View page: everything the edit page sets, in DESIGN.md order
   - Luck special text
4. Leveling up
   - Level up opens the improvement picker; remove the edit-page checkboxes
   - Choices made on the improvement itself (DESIGN.md)
   - Apply effects: ratings (respecting `max`), list picks, luck recovery
   - Specials recorded only
5. Change `the-spellslinger.json` as needed along the way
   - Authored ids where the code needs them
   - Fix the known data errors (below)

Not MVP: the other 11 playbooks, save migration, sync, keeper tools.

# 2. After MVP

- A second playbook, picked to stress the schema (Expert, Monstrous, Chosen, or Wronged)
- Draft the schema (soon)
   - JSON Schema files in `/schema/`: playbook, hunter, probably `common.schema.json`
   - A big comment on each: preliminary and descriptive, not prescriptive; changes if development needs it
   - `npm run validate` (ajv) if it's worth it
- Settle the schema (after the second playbook)
- Discuss moving some logic to the model (mirror the schema in code)
   - e.g. define node interface, then move some of the parsing/export logic there?
   - Node types like "choices", "options", etc following the schema
   - PlaybookModel.js, HunterModel.js, CommonModel.js
- Migrating hunters from old versions (a loader that upgrades old saves)
- Remaining core playbooks
- Basic move popups (needs basic rules JSON)
- Add more sources, probably in a submodule (removes the issue of hosting copyrighted pdfs), and model the rest of the playbooks
   - `/sources/` == `_motw-sources` repo
   - `/sources/pdf`, `/sources/md`, `/sources/html`, `/sources/scripts`
   - Playbook jsons remain in `/playbooks/` as part of the app.
   - Don't worry about scrubbing the git history
- List of playbooks ordered by book release date, then alphabetically (right now we only have the pdf for core)
- Responsive columns (DESIGN.md)
- Replace `confirm`/`alert` in `ActionList.vue`, `Storage.js`, and leveling down
- Reconcile `DESIGN.md` with what shipped
- Pick the app name
- Hunter name buttons (DESIGN.md): currently Edit and Export icons inside the title
   - Move them to a buttons section next to the hunter name
   - Export as a popup (now a direct download)
   - Add a Share button
- History: the other hunter picks from *their* playbook how they know you (DESIGN.md); needs their playbook's history list
- Rating colors: check them in light and dark mode
- `computed.moves`: a `source` on each move (which level / improvement it came from); `h.moves` is display-only for now
- "Bend the rules": temporary/debug for now; decide what it becomes
- Tests in the deploy pipeline
- Better view and filter for "take a move from another playbook" choice picker

# Later

- Keeper view: several hunters on one page (`provideHunter` per hunter)
- Google Drive sync
- Share by URL? (using a compressed, minified hunter json as a URL param)
- Use info from the official "playbook menu" for playbook-choice workflow

# Known issues

- `the-spellslinger.json` text predates the md audit: 7 move descriptions differ from the corrected `sources/md/the-spellslinger.md` (e.g. Arcane Reputation, Tools and Techniques)
- Initiate's and Professional's granted moves have no name; auto ids need one

- Edit page is too cluttered; more should be in popups
- Mythic improvement costs are fixed at 2 (Keeper-chosen schemes are post-MVP)
- Saves from older hunter formats can only be deleted (the sample was converted with one-off scripts)
- Saves are always the "full" hunter JSON; the "slim" version (DESIGN.md) isn't built
- `basic_moves.json` has names and ratings only, no descriptions (needed for popups)
- `[[wikilinks]]` render as dotted-underline text, no popup yet
- A hunter's playbook copy is indexed once; editing the copy (it's meant to be modifiable) won't re-index it. Nothing edits it yet.
- ESLint `max-len` with `ignoreStrings` skips any line that contains a string, so most long lines aren't reported
