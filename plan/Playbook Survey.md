What varies between the 12 playbooks, for designing a schema that fits all of them. Source: `playbooks/md/`; checked against it after the md audit (2026-10-16).

Common to every playbook (unless listed): luck, harm, experience, ratings lines, look, pronouns, introductions, history, improvements.

# Playbook-specific sections

| Playbook      | Section                    | Rule |
| ------------- | -------------------------- | --- |
| Chosen        | Fate: how you found out    | pick 1 |
|               | Fate: heroic/doom tags     | pick 2 from each |
|               | Special weapon             | 1 form + 3 business-end + material (free text, with suggestions); tags add up |
|               | Protective gear            | optional, 1-armour |
| Crooked       | Background                 | pick 1 (implied: "What did you do?"; each option is effectively a move) |
|               | Heat                       | pick *at least* 2, each with a name blank *inside* the sentence ("A police detective, ____, has...") |
|               | Underworld                 | pick 1; each option has its own pick-1 sub-choice |
|               | Gear                       | pick 3 effective weapons |
| Divine        | Mission                    | pick 1 |
|               | Gear                       | divine weapon pick 1; divine armour granted (1-armour holy) |
| Expert        | Haven                      | pick 3 of 9 |
|               | Gear                       | pick 3 monster-slaying weapons |
| Flake         | Gear                       | 1 normal weapon + 2 hidden weapons |
| Initiate      | Sect                       | free-text questions; good traditions pick 2, bad traditions pick 1 |
|               | Gear                       | 3 old-fashioned, or 2 modern, or 2 + 1, *depending on the Sect's traditions* |
| Monstrous     | Breed                      | free-text decisions (origin, alignment); curse pick 1 (Vulnerability: a substance blank; Pure Drive: pick an emotion from a list) |
|               | Natural attacks            | a base + an extra, *or* two bases |
|               | Breed suggestions          | reference only (preset curse + attacks + moves) |
|               | Gear                       | optional, pick 0–1 |
| Mundane       | Gear                       | 2 weapons + 1 transport |
| Professional  | Agency                     | free-text questions; resources pick 2, red tape pick 2 |
|               | Gear                       | 1 serious + 2 normal weapons; flak vest *or* combat armour |
| Spell-Slinger | Combat Magic               | pick 3 across bases and effects, at least 1 base |
|               | Tools & Techniques         | cross off 1 of 4 |
| Spooky        | Dark side                  | pick 3 tags |
|               | Gear                       | pick 2 normal weapons (+ any magical items, free text) |
| Wronged       | Who you lost               | pick *1 or more*, each with a name blank |
|               | My prey                    | free text (a monster breed, with the Keeper's agreement) |
|               | Why couldn't you save them | pick 1 or more |
|               | Gear                       | 1 signature + 2 practical weapons; optional vehicle |

Hardest cases: Monstrous natural attacks (either/or), Initiate gear (depends on another section), Heat and Who You Lost (open-ended count, blanks per pick).

# Moves

- Granted moves: Chosen 2; Initiate, Professional, Spell-Slinger, Wronged 1
   - Initiate's and Professional's granted moves have no name (auto ids need one)
   - Professional's is listed after the picks ("And you get this one")
- Moves with their own build-time choices:
   - Practitioner: pick 2 of 10
   - Arcane Reputation: 3 free text; Enchanted Clothing: 1 free text
   - Crooked's Artifact: pick 1
   - Crooked's Deal with the Devil: pick 1 or 2
   - Professional's Mobility: 2 good + 1 bad
- Moves with play-time choices (display only, not stored): Could've Been Worse, Spooky's Hex, Professional's Medic
- Moves that change ratings: Professional's Unfazeable (+1 Cool, max +3); Flake's Crazy Eyes (+1 Weird, max +3); Deal with the Devil's "skill" option (+1 to two ratings)
- Moves that change armour: Professional's Battlefield Awareness (+1 armour, max 2-armour)

# Look

- 2 lists in seven playbooks, 3 in five
- Every list ends in a free-text blank

# Improvements

Shared by every playbook: rating increases, extra moves, moves from another playbook, and the advanced list (change playbook, second hunter, advanced basic moves, retire, erase luck). Most playbooks also have "Get back one used Luck point" in the regular list (Mundane: four).

Beyond those:

| Kind                            | Examples |
| ------------------------------- | --- |
| Pick from a section again       | Combat Magic (Spell-Slinger), natural attacks (Monstrous), haven option (Expert, Flake, Wronged) |
| Cross off one more              | Tools & Techniques (Spell-Slinger) |
| Either/or                       | add a resource tag *or* change a red tape tag (Professional) |
| Gain another playbook's section | "a haven, like the Expert has, with two options" (Flake, Monstrous, Wronged); one specific haven option (Spooky: mystical library) |
| Redo a choice                   | mission, or a new one with the Keeper's agreement (Divine); some or all dark side tags (Spooky); prey (Wronged) |
| Remove a choice                 | a doom tag, optionally a heroic tag (Chosen); a dark side tag (Spooky) |
| Compound                        | Monstrous: curse no longer applies *and* -1 Weird |
| Narrative only                  | an ally (Chosen, Crooked, Divine), a stash of money (Crooked), command of a team (Initiate, Professional), lead the Sect (Initiate), Keeper makes the next mystery about your prey (Wronged) |
| Affects other hunters           | hire other players' hunters into your Agency (Professional) |

The haven belongs to the Expert; Flake, Monstrous, Wronged, and Spooky can gain it (or part of it) through improvements.
