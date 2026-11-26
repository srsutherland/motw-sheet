/**
 * This file was automatically generated from `../hunter.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

import type {DateString, PlainText, Ratings, Reference, Tags} from "./common.schema";
import type {Playbook} from "./playbook.schema";

/**
 * Choices and plain values;
 * ratings, moves, gear and features follow from replaying getting_started, then each improvement in
 * the order taken.
 */
export interface Hunter {
  /** JSON Schema URI */
  $schema?: string;
  /** Hunter format version (date of the last breaking change) */
  schema_version: "0.1.2026.11.24";
  /** Unique id */
  uid: string;
  /** Creation timestamp */
  created: Timestamp;
  /** When last saved. */
  updated?: Timestamp;
  /** Playbook display name (`The Spell-Slinger`) */
  playbook_name: string;
  /** The playbook's `updated` date when this hunter was made. */
  playbook_updated?: DateString | "";
  /** Hunter name */
  name: string;
  /** Pronouns */
  pronouns?: string;
  /** Look list key -> the pick, or what was written in. */
  look: {
    [k: string]: string;
  };
  /** A copy of the chosen ratings line. */
  ratings_base: Ratings | null;
  /** Relationships with the other hunters */
  history: {
    /** Other hunter's name */
    name?: string;
    /** Relationship: a playbook option, freely edited */
    option?: string;
    notes?: string;
  }[];
  /**
   * Choices for the playbook's getting_started: an entry per grant, and the choices for the choose
   * rule(s)
   */
  getting_started: Choices & {
    grant: RefWithChoices[];
  };
  /** In the order taken. */
  improvements: RefWithChoices[];
  /** Gear added during play. */
  extra_gear: {
    name: string;
    tags: Tags;
  }[];
  /** Harm marked */
  harm: number;
  /** Unstable wounds */
  unstable: boolean;
  /** Luck spent */
  luck_used: number;
  /** Experience marked (out of 5) */
  experience: number;
  /** Total level, including unspent improvements */
  level: number;
  computed?: Computed;
  /** A reference to (`@the_spellslinger`), or copy of, the hunter's playbook */
  playbook: string | Playbook;
}

/**
 * ISO 8601 timestamp
 */
export type Timestamp = string;

/**
 * The hunter's side of an object's choose rule(s).
 * One rule: `chosen` directly.
 * Several: `choose`, mirroring the playbook (the nth rule with a given `from` goes with the nth
 * entry with that `from`).
 * No rules: neither.
 */
export interface Choices {
  chosen?: Choice[];
  choose?: {
    from: Reference;
    chosen: Choice[];
  }[];
}

/**
 * One choice:
 * - a reference: relative to the container it's chosen from (`@bases.blast`), as written there if
 *   the option is itself a reference (`@basic_moves.use_magic.heal`), or absolute for another
 *   playbook (`@the_spellslinger.moves.practitioner`)
 * - a plain-string option: as written
 * - free text: { ref: "@textbox", text }
 * - a choice with its own choices: { ref, chosen } / { ref, choose }
 */
export type Choice = Reference | PlainText | TextChoice | RefWithChoices;

export interface TextChoice {
  ref: "@textbox";
  text: string;
}

/**
 * The hunter's side of a playbook object (a grant, an improvement, a pick with its own choices):
 * just its reference when nothing's attached, otherwise { ref, ... }.
 * Improvements:
 * - root-relative (`@improvements.weird`)
 * - `cost` if it cost more than 1
 * - `pending` while being picked
 */
export type RefWithChoices =
  | Reference
  | (Choices & {
      ref: Reference;
      cost?: number;
      pending?: true;
    });

/**
 * Derived sheet values, not authoritative.
 * Moves and features are copies of the playbook objects, plus `selected` (picked from their
 * options, written like `chosen`) and `crossed`.
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
