/**
 * This file was automatically generated from `../hunter.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

import type {DateString, PlainText, Ratings, Reference, Tags} from "./common.schema";
import type {Playbook} from "./playbook.schema";

/**
 * Choices and plain values; ratings, moves, gear and features follow from replaying getting_started, then each improvement in the order taken.
 */
export interface Hunter {
  /**
   * This file's schema, for editors.
   */
  $schema?: string;
  schema_version: "0.1.2026.11.24";
  uid: string;
  created: Timestamp;
  /**
   * When last saved.
   */
  updated?: Timestamp;
  playbook_name: string;
  /**
   * The playbook's `updated` date when this hunter was made.
   */
  playbook_updated?: DateString | "";
  name: string;
  pronouns?: string;
  /**
   * Look list key -> the pick, or what was written in.
   */
  look: {
    [k: string]: string;
  };
  /**
   * A copy of the chosen ratings line.
   */
  ratings_base: Ratings | null;
  history: {
    name?: string;
    option?: string;
    notes?: string;
  }[];
  /**
   * Mirrors the playbook's getting_started: a record per grant, and the choices for its choose rule(s).
   */
  getting_started: Choices & {
    grant: RefWithChoices[];
  };
  /**
   * In the order taken.
   */
  improvements: RefWithChoices[];
  /**
   * Gear added during play.
   */
  extra_gear: {
    name: string;
    tags: Tags;
  }[];
  harm: number;
  unstable: boolean;
  luck_used: number;
  experience: number;
  level: number;
  computed?: Computed;
  /**
   * Its playbook: a reference to the file (`@the_spellslinger`), loaded as a copy of it, or the hunter's own copy ("full" format).
   */
  playbook: string | Playbook;
}

export type Timestamp = string;

/**
 * The hunter's side of an object's choose rule(s). One rule: `chosen` directly. Several: `choose`, mirroring the playbook (the nth rule with a given `from` goes with the nth entry with that `from`). No rules: neither.
 */
export interface Choices {
  chosen?: Choice[];
  choose?: {
    from: Reference;
    chosen: Choice[];
  }[];
}

/**
 * One choice, written relative to the container it's chosen from (`@bases.blast`), as written there if the option is itself a reference (`@basic_moves.use_magic.heal`), or absolute for another playbook (`@the_spellslinger.moves.practitioner`). A plain-string option is stored as written. Free text: { ref: "@textbox", text }. A choice with its own choices: { ref, chosen } / { ref, choose }.
 */
export type Choice = Reference | PlainText | TextChoice | RefWithChoices;

export interface TextChoice {
  ref: "@textbox";
  text: string;
}

/**
 * The hunter's side of a playbook object (a grant, an improvement, a pick with its own choices). Just its reference when nothing's attached; otherwise { ref, ... }. Improvements: root-relative (`@improvements.weird`); `cost` if it cost more than 1; `pending` while being picked.
 */
export type RefWithChoices =
  | Reference
  | (Choices & {
      ref: Reference;
      cost?: number;
      pending?: true;
    });

/**
 * What the sheet shows, derived from the rest; not authoritative. Moves and features are copies of the playbook objects, plus `selected` (picked from their options, written like `chosen`) and `crossed`.
 */
export interface Computed {
  ratings: Ratings;
  moves: ComputedItem[];
  gear: {}[];
  features: ComputedItem[];
}

export interface ComputedItem {
  selected?: Choice[];
  crossed?: Choice[];
}
