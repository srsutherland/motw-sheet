/**
 * This file was automatically generated from `../common.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

/**
 * Reference id: lowercase letters, digits and underscores;
 * defaults to one made from `name` ("Could've Been Worse" -> couldve_been_worse)
 */
export type Id = string;

/**
 * Any reference: `@` and what it refers to.
 */
export type Reference = RefPath | RefRelative | RefThis | RefAllPlaybooks | RefTextbox | RefSplice;

/**
 * A path of ids.
 * Root-relative, unless the first segment is a file id: `@combat_magic.bases`,
 * `@basic_moves.use_magic.heal`, `@the_expert.haven`.
 */
export type RefPath = string;

/**
 * A root-relative path whose first segment would otherwise read as a file id: `@.basic_moves`.
 */
export type RefRelative = string;

/**
 * The object the reference is written in.
 */
export type RefThis = "@this";

/**
 * The same list in every other playbook: `@*.moves`
 */
export type RefAllPlaybooks = string;

/**
 * A free-text option.
 * Chosen: { "ref": "@textbox", "text": "..." }.
 */
export type RefTextbox = "@textbox";

/**
 * In an on_edit / on_view array: the object's own value.
 */
export type RefSplice = "@...";

/**
 * What a choose rule chooses from.
 */
export type RefFrom = RefPath | RefRelative | RefThis | RefAllPlaybooks;

/**
 * A plain value, not a reference: anything not starting with `@`.
 */
export type PlainText = string;

/**
 * Display text: a markdown subset plus [[wikilinks]] and <span class='...'>.
 */
export type Markdown = string;

/**
 * One paragraph as a string, or several as an array of strings.
 */
export type Paragraphs = Markdown | Markdown[];

/**
 * Date (yyyy-mm-dd)
 */
export type DateString = string;

/**
 * 0.1.yyyy.mm.dd: the date of the last breaking change, plus .1, .2... if it breaks again on a day
 * it was already pushed.
 */
export type SchemaVersion = string;

/**
 * Rating name
 */
export type Rating = "charm" | "cool" | "sharp" | "tough" | "weird";

/**
 * A ratings line: one value per rating.
 */
export interface Ratings {
  charm: number;
  cool: number;
  sharp: number;
  tough: number;
  weird: number;
}

/**
 * Gear and attack tags, one word each: "2-harm", "close", "+1-armour".
 */
export type Tags = string[];

/**
 * A `choose` rule
 */
export interface ChooseRule {
  /** Container to choose from (default `@this`) */
  from?: RefFrom;
  /**
   * - pick: add it
   * - cross: strike it out, still visible
   * - remove: undo an earlier pick
   * - attach: attach this option to one of your picks, without picking it again
   */
  verb: "pick" | "cross" | "remove" | "attach";
  /** Number of choices */
  count: number;
  /** Minimum number of choices (default: `count`) */
  min?: number;
  /** Min / max per sub-list, keyed by sub-list reference */
  limits?: {
    [k: string]: {
      min?: number;
      max?: number;
    };
  };
}

/**
 * A choose rule, or a list of them
 */
export type Choose = ChooseRule | ChooseRule[];

/**
 * References gained outright, one or several;
 * granting a list grants everything in it
 */
export type Grant = RefPath | RefPath[];

/**
 * A fixed effect: a rating change (respecting `max`), luck (one-off, when taken), or marking this
 * object's picks of basic moves as advanced.
 */
export type Effect =
  | {
      rating: Rating;
      add: number;
      max?: number;
    }
  | {
      luck: number;
    }
  | {
      advance_basic: true;
    };

/**
 * Display-only sub-items, chosen during play rather than when building the hunter (Could've Been
 * Worse's options, Dark Past's questions).
 */
export type Details = (
  | Markdown
  | {
      name: string;
      description: Markdown;
    }
)[];

/**
 * on_edit / on_view: keys that replace the object's own on that page.
 * In an array, `@...` stands for the object's own value.
 */
export interface PageOverride {
  name?: string;
  description?: Paragraphs;
  heading?: Markdown;
  details?: Details;
}
