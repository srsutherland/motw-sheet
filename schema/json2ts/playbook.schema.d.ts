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
  /**
   * This file's schema, for editors.
   */
  $schema?: string;
  schema_version: SchemaVersion;
  updated: DateString;
  /**
   * The file id: absolute references start with it (`@the_expert.haven`).
   */
  id: string;
  type: "playbook";
  name: string;
  emoji?: string;
  quote?: Markdown;
  luck: {
    max: number;
    special: Markdown;
  };
  harm: {
    max: number;
    /**
     * Harm at which wounds become unstable.
     */
    unstable: number;
  };
  /**
   * Features shown before the moves (Combat Magic, Monster Breed).
   */
  pre_moves?: Feature[];
  moves: MoveList;
  /**
   * Features shown after the moves (Haven).
   */
  post_moves?: Feature[];
  starting_gear: GearList;
  getting_started: GettingStarted;
  look: Look;
  ratings_base: {
    heading?: string;
    /**
     * @minItems 1
     */
    options: [Ratings, ...Ratings[]];
  };
  introductions?: Text;
  /**
   * Plain values: pre-fills the hunter can edit freely.
   */
  history: {
    description?: Paragraphs;
    options: PlainText[];
  };
  leveling_up?: Text;
  improvements: ImprovementList;
  improvements_advanced?: ImprovementList;
  /**
   * Homebrew: not on the paper playbook.
   */
  improvements_mythic?: ImprovementList;
}

export interface Text {
  description: Paragraphs;
}

/**
 * An entry in `options`: a reference (`@basic_moves.use_magic.heal`, `@textbox`), a plain string (stored as written), or an object.
 */
export type Option = Reference | PlainText | Node;

/**
 * A playbook object. Its `type` says where it goes when gained (move, gear, feature); options inside a feature or move usually have none. An untyped object with `options` and no `choose` is a sub-list (Combat Magic's bases): its options are offered with the container's, grouped. With its own `choose`, it's an option with its own choice (Pure Drive's emotion). It needs an `id`, or a `name` to make one from: choices are stored by path.
 */
export type Node = {
  [k: string]: unknown;
} & {
  id?: Id;
  type?: "move" | "gear" | "feature";
  name?: string;
  description?: Paragraphs;
  heading?: Markdown;
  tags?: Tags;
  options?: Option[];
  choose?: Choose;
  effects?: Effect[];
  details?: Details;
  on_edit?: PageOverride;
  on_view?: PageOverride;
};

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

export interface MoveList {
  id: "moves";
  description?: Paragraphs;
  options: Move[];
}

export interface GearList {
  id: "starting_gear";
  description?: Paragraphs;
  heading?: Markdown;
  options: Gear[];
}

/**
 * Character creation: what you're granted and the choices you make, in the same shape as an improvement.
 */
export interface GettingStarted {
  description?: Paragraphs;
  grant?: Grant;
  choose?: Choose;
}

/**
 * Lists to pick one from each, keyed by what they describe (clothes, eyes, aura...).
 */
export interface Look {
  heading?: string;
  [k: string]:
    | {
        /**
         * How the pick reads on the sheet: `___` stands for it ("___ clothes").
         */
        format: string;
        options: (PlainText | RefTextbox)[];
      }
    | string
    | undefined;
}

export interface ImprovementList {
  id: Id;
  description?: Paragraphs;
  /**
   * When the list unlocks. level: level ups completed before the one being spent; improvements: improvements taken.
   */
  requires?: {
    level?: number;
    improvements?: number;
  };
  /**
   * Improvements each one costs.
   */
  cost?: number;
  options: Improvement[];
}

/**
 * Ids are explicit and unique across all improvement lists (mythic ones prefixed mythic_).
 */
export interface Improvement {
  id: Id;
  type: "improvement";
  description: Markdown;
  grant?: Grant;
  choose?: Choose;
  effects?: Effect[];
  special?: "change_playbook" | "second_hunter" | "retire" | "turn_evil";
  cost?: number;
  /**
   * Its own options ("+1 to any rating": one per rating).
   */
  options?: Option[];
}
