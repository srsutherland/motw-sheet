Rough order of work. The schema grows out of building the Spell-Slinger; `Schema Notes.md` and `Playbook Survey.md` are for discussion along the way, not a spec to finish first.

# 1. MVP

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
- Settle the schema
   - Tighten `playbook.schema.json`; `npm run validate` checks every playbook
- Saved hunter `version` + loader that upgrades old saves
- Remaining playbooks
- Basic move popups (needs basic rules JSON)
- Responsive columns (DESIGN.md)
- Replace `confirm`/`alert` in `ActionList.vue` and `Storage.js`
- Reconcile DESIGN.md with what shipped
- Pick the app name

# Later

- Keeper view: several hunters on one page (`provideHunter` per hunter)
- Google Drive sync
- Share by URL?

# Known issues

- `the-spellslinger.json`:
   - first "Take a move from another playbook" has `increase: "moves"`, should be `moves_other`
   - Combat Magic "at least one base" is `"pick": ">1"` (reads as "more than one")
- `Hunter.stats` is dead; pages use `hunter.ratings`
- Gear pick limit not enforced
- "Add Move" button does nothing
- `PreMove.vue` is a stub
- No pronouns anywhere
- `playbook.schema.json` enforces nothing (`additionalProperties: true` throughout) and nothing runs it
