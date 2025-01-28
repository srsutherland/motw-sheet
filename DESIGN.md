App to create, view, and edit digital character sheets from the Monster of the Week TTRPG. Built in Vue3 with Vite.

# Pages

## root

From the main page, the user can create a new character sheet, view an existing character sheet, or edit an existing character sheet.

## /new

A list of playbooks is displayed for the user to choose one. Selecting a playbook will create a new hunter with that playbook and redirect to the /edit page for that hunter.

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