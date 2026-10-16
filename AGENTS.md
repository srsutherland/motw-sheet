# AGENTS.md

For AI agents (and people) working on this repo. Read this first, then the docs below.

## What this is

A character sheet app for *Monster of the Week* players (hunters, not Keepers): create, view and edit hunters. Vue 3 + Vite, static site on GitHub Pages, data in the browser (localStorage) plus file import/export. One playbook (the Spell-Slinger) is built so far; the other 11 come after the schema settles.

## Docs

| File                      | Contents                         |
| ------------------------- | -------------------------------- |
| `AGENTS.md`               | This file, project-agnostic guidance for AI agents. |
| `DESIGN.md`               | UI/functional/page spec          |
| `ARCHITECTURE.md`         | Top-level design document        |
| `plan/Schema Notes.md`    | Playbook and hunter JSON design  |
| `plan/Roadmap.md`         | High-level roadmap, known issues |
| `plan/Playbook Survey.md` | What varies between playbooks    |
| `plan/Name Ideas.md`      | App name candidates and criteria |

## Working with the maintainer

- **Begin each reply with the current date.**
- **Don't reverse a decision silently.** If `DESIGN.md`, the plan docs, or the code disagree, or you want to change something already decided, ask first. Several past mistakes were "followed the doc / my own idea without saying so".
- **Several questions:** ask them as multiple-choice questions, one question per item (not one multi-select covering several).
- **Describing a data shape:** include an abbreviated JSON example, ideally with real data (`samples/`).
- Don't nitpick things the maintainer has already handled; move the work forward.

## Documentation

- **Don't present your own inventions as decided.** When documenting, new conventions go under a **Proposals** section, labelled as yours, until the maintainer agrees.
- **Docs style:** terse lists and parentheticals, like the existing docs; record only what was decided, no extra detail. Tables: align the interior `|`s, don't pad the last column if it would bring it over ~80 chars.

## Git

- Work on a feature branch off `main`. Push it; the maintainer reviews pushed branches.
- `main` only moves by **fast-forward** (`git merge --ff-only`): no merge commits, no squashing. Rebase a branch onto `main` before it goes in. Where possible, also follow the same practice for feature branches.
- Pushing `main` deploys the site (GitHub Pages).
- Group commits by concern (e.g. format change, UI fixes, docs). 
- A formatting-only commit goes in `.git-blame-ignore-revs`.
- Force-push only branches you own, with `--force-with-lease`.
- Stage specific paths, not `git add -A` on whole folders: the maintainer often has uncommitted edits (especially in docs) that aren't yours to commit.
- To that note, always check the maintainer's edits (git status) before committing.

## Before committing

- `npm run lint` (ESLint; it also fixes formatting) and `npm test`.
- `npm test` = `test:engine` (data layer and hunter state, against the real JSON) + `test:e2e` (browser tests; drive an installed Edge, or `TEST_BROWSER=chrome`).
- `max-len` (100) skips any line containing a string (`ignoreStrings`), so check long lines yourself.
- `git status` to check the current state of your working directory and staging area.

## Code style

ESLint enforces it (no Prettier: the maintainer tried it and rejected its layout):
- single quotes, semicolons, trailing commas, 4-space indent
- nothing indented directly under `<template>` or `<script>` in `.vue` files
- multi-line tags: one attribute per line

Conventions:
- `const props = defineProps(...)` and `const emit = defineEmits(...)` even when unused (lint allows it)
- Comments explain *why*, sparingly; match the surrounding code
- Modern JS over utility libraries

