App to create, view, and edit digital character sheets from the Monster of the Week TTRPG. Built in Vue3 with Vite.

# Pages

## root

From the main page, the user can create a new character sheet, view an existing character sheet, or edit an existing character sheet.

## /new

A list of playbooks is displayed for the user to choose one. Selecting a playbook will create a new hunter with that playbook and redirect to the /edit page for that hunter.

## /{id}

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

## /{id}/edit

This page has responsive columns with the following sections:

1. Hunter name (displayed as "{name} the {playbook}"; name is editable)
2. Ratings (during character creation, this is hidden until the user makes a ratings selection)
3. Gear (editable; select from options)
4. Moves (editable; if moves are available, select from options)
5. (special) Playbook-specific sections
6. Look (editable; select from options)
7. Ratings selection
8. History 
   - A section for each other hunter at your table with:
     - select from your playbook how you know them
     - they select from their playbook how they know you
     - a field for notes/clarification on each relationship