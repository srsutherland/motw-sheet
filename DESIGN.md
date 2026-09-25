App to create, view, and edit digital character sheets from the Monster of the Week TTRPG. Built in Vue3 with Vite.

# Pages

## root (no query)

From the main page, the user can create a new character sheet, view an existing character sheet, or edit an existing character sheet.

## ?new

A list of playbooks is displayed for the user to choose one. Selecting a playbook will create a new hunter with that playbook and redirect to the ?edit page for that hunter.

## ?view={id}

This page displays the given hunter. It has responsive columns with the following sections:

1. Hunter name (displayed as "{name} the {playbook}")
   - Pronouns
   - Also displays the hunter's "look" (e.g. eyes, hair, clothes) 
2. Ratings
   - Charm, Cool, Sharp, Tough, Weird
   - Each rating is displayed with with:
      - The modifier in a bubble [-1 to +3] color-coded by value (red, orange, yellow, green, blue)
      - The name of the rating
      - The one or two basic moves associated with the rating (hovering gives a pop-up with the move's description)
3. Luck track 
   - Displayed as a track of 7 boxes, from "Okay" to "Doomed"
   - "+" and "-" buttons to adjust
4. Harm track
   - Displayed as a track of 7 boxes, from "Okay" to "Dying"
   - "+" and "-" buttons to adjust
   - At 4 harm, the "unstable" box is checked
5. Experience track
   - Displayed as a track of 5 boxes, from 0 to 5
   - "+" and "-" buttons to adjust
   - When the 5th box is checked, the "Advancement" button is displayed
6. "Pre-moves" section(s), if any (playbook-specific)
   - e.g. "Background" for the crooked or "Haven" for the expert or "Combat magic" for the spell-slinger
7. Moves section
8. Gear section
9. "Post-moves" section(s), if any (playbook-specific)
10. History

## ?edit={id}

This page has responsive columns with the following sections:

1. Hunter name (displayed as "{name} the {playbook}"; name is editable)
2. Ratings display (during character creation, this is hidden until the user makes a ratings selection below)
3. Gear (editable; select from options)
4. Moves (editable; lists current moves, and if moves are available, has a button to pop up a list of available moves to add)
5. (special) Playbook-specific sections
6. Look (editable; select from options)
7. Ratings selection (a radio selection of initial arrays)
8. History 
   - A section for each other hunter at your table with:
     - a textbox to type their name and playbook
     - select from your playbook how you know them
     - they select from their playbook how they know you
     - a field for notes/clarification on each relationship
     - (This isn't actually a data link to another hunter, it's just local strings selected from options)
9. Improvements
   - Improvements provide either a pre-determined increase or provide a reference to some list you can choose from
   - The user selects an improvement, and if it offers a choice, the choice is tied to the improvement itself.
   - Improvement choices should be made in a popup window (or dropdown if simple)

# Data Model

## Playbook JSON

The app uses json files in `/playbooks/` as its source of truth.

### Creation

- Markdown files are created from the PDF as an intermediate, better-structured format.
- Markdown files are converted to html to check that they look the same as the PDF
- Markdown files are then used as a reference in creating the JSON files.

### Format

- Display text is markdown, with caveats:
   - `[[wikilinks]]` to game terms that should have a dotted line and a popup.
   - `<span class='something'>` for stuff with other special tags

## Hunter class/json

- "Full" version (serialize objects all the way down) and a "Slim" version (references where possible)
- Contains an schema version number, in case of future breaking changes (keep this at 0.1 for now, we're the only users).

### Clarifications

- Level is separate from improvements taken; "Special" improvements may require more than one unspent improvement (not in the base game).