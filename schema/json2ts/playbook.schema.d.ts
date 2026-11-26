/**
 * This file was automatically generated from `../playbook.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

import type {
  Choose,
  DateString,
  Details,
  Effect,
  Grant,
  Id,
  Markdown,
  PageOverride,
  Paragraphs,
  PlainText,
  Ratings,
  RefTextbox,
  Reference,
  SchemaVersion,
  Tags
} from "./common.schema";

export interface Playbook {
  /** JSON Schema URI */
  $schema?: string;
  schema_version: SchemaVersion;
  /** Date last changed */
  updated: DateString;
  /** File id, the first segment of absolute references (`@the_expert.haven`) */
  id: string;
  /** Object type hint */
  type: "playbook";
  /** Display name, including "The" (`The Spell-Slinger`) */
  name: string;
  /** Emoji icon (`🔮`) */
  emoji?: string;
  /** Flavor text at the top of the playbook */
  quote?: Markdown;
  /** Luck track */
  luck: {
    /** Number of boxes */
    max: number;
    /** Playbook's consequences for spending luck */
    special: Markdown;
  };
  /** Harm track */
  harm: {
    /** Number of boxes */
    max: number;
    /** Harm at which wounds become unstable. */
    unstable: number;
  };
  /** Features shown before the moves (Combat Magic, Monster Breed). */
  pre_moves?: Feature[];
  moves: MoveList;
  /** Features shown after the moves (Haven). */
  post_moves?: Feature[];
  starting_gear: GearList;
  getting_started: GettingStarted;
  look: Look;
  /** Initial ratings arrays */
  ratings_base: {
    /** Heading text displayed before the options */
    heading?: string;
    /**
     * List of options to choose from
     *
     * @minItems 1
     */
    options: Ratings[];
  };
  /** Introductions section */
  introductions?: Text;
  /** Relationship options for the other hunters (plain text, freely edited once picked) */
  history: {
    description?: Paragraphs;
    options: PlainText[];
  };
  improvements: Improvements;
}

export interface Text {
  description: Paragraphs;
}

/**
 * An entry in `options`: a reference (`@basic_moves.use_magic.heal`, `@textbox`), a plain string
 * (stored as written), or an object.
 */
export type Option = Reference | PlainText | Node;

/**
 * A playbook object.
 * Needs an `id`, or a `name` to make one from (choices are stored by path).
 * - Untyped, with `options` and no `choose`: a sub-list (Combat Magic's bases), offered grouped
 *   with the container's options
 * - With its own `choose`: an option with its own choice (Pure Drive's emotion)
 */
export interface Node {
  id?: Id;
  /** Object type hint */
  type?: "move" | "gear" | "feature";
  /** Display name */
  name?: string;
  /** The display text from the playbook */
  description?: Paragraphs;
  /** Heading text displayed before the options */
  heading?: Markdown;
  tags?: Tags;
  /** List of options to choose from */
  options?: Option[];
  choose?: Choose;
  /** Effects when gained */
  effects?: Effect[];
  details?: Details;
  on_edit?: PageOverride;
  on_view?: PageOverride;
}

/**
 * A playbook-specific section that isn't a move (Combat Magic, Haven, Curse).
 */
export type Feature = Node & {
  type: "feature";
};

export type Move = Node & {
  type: "move";
};

export type Gear = Node & {
  type: "gear";
};

/**
 * Playbook moves
 */
export interface MoveList {
  /** Reference id */
  id: "moves";
  /** The display text from the playbook */
  description?: Paragraphs;
  /** List of options to choose from */
  options: Move[];
}

/**
 * Starting gear options
 */
export interface GearList {
  /** Reference id */
  id: "starting_gear";
  /** The display text from the playbook */
  description?: Paragraphs;
  /** Heading text displayed before the options */
  heading?: Markdown;
  /** List of options to choose from */
  options: Gear[];
}

/**
 * Character creation: what you're granted and the choices you make, in the same shape as an
 * improvement.
 */
export interface GettingStarted {
  /** The display text from the playbook */
  description?: Paragraphs;
  grant?: Grant;
  choose?: Choose;
}

/**
 * Look traits (clothes, eyes, aura...)
 */
export interface Look {
  /** Reference id */
  id: "look";
  /** Heading text displayed before the options */
  heading?: string;
  /** List of traits, one pick from each */
  options: LookTrait[];
}

/**
 * Look trait: display format and options
 */
export interface LookTrait {
  id: Id;
  /** How the pick reads on the sheet: `___` stands for it ("___ clothes"). */
  format: string;
  /** List of options to choose from */
  options: (PlainText | RefTextbox)[];
}

/**
 * Leveling up: the improvement lists
 */
export interface Improvements {
  /** Reference id */
  id: "improvements";
  /** The display text from the playbook */
  description?: Paragraphs;
  /** Improvement lists: basic, advanced, and mythic (homebrew: not on the paper playbook) */
  options: ImprovementList[];
}

/**
 * Improvement list
 */
export interface ImprovementList {
  /** Reference id */
  id: "basic" | "advanced" | "mythic";
  /** Display name */
  name: string;
  /** The display text from the playbook */
  description?: Paragraphs;
  /** Unlock conditions */
  requires?: {
    /** Level ups completed before the one being spent */
    level?: number;
    /** Improvements taken */
    improvements?: number;
  };
  /** Cost of each, in unspent improvements */
  cost?: number;
  /** List of options to choose from */
  options: Improvement[];
}

/**
 * An improvement option (ids explicit and unique across all improvement lists;
 * mythic ones prefixed `mythic_`)
 */
export interface Improvement {
  id: Id;
  /** Object type hint */
  type: "improvement";
  /** The display text from the playbook */
  description: Markdown;
  grant?: Grant;
  choose?: Choose;
  /** Effects when gained */
  effects?: Effect[];
  /** Kind of special improvement effect */
  special?: "change_playbook" | "second_hunter" | "retire" | "turn_evil";
  /** Cost in unspent improvements (default: the list's `cost`, or 1) */
  cost?: number;
  /** List of options to choose from ("+1 to any rating": one per rating) */
  options?: Option[];
}
