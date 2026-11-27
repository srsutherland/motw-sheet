/**
 * This file was automatically generated from `../basic-moves.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

import type {
  DateString,
  Details,
  Id,
  Markdown,
  Paragraphs,
  Rating,
  SchemaVersion
} from "./common.schema";

/**
 * The moves every hunter has.
 */
export interface BasicMoves {
  /** JSON Schema URI */
  $schema?: string;
  schema_version: SchemaVersion;
  /** Date last changed */
  updated: DateString;
  id: "basic_moves";
  type: "basic_moves";
  name: string;
  options: {
    id?: Id;
    /** Object type hint */
    type: "basic_move";
    /** Display name */
    name: string;
    /** Rating rolled (none for Big Magic) */
    rating?: Rating;
    /** The display text from the reference sheet */
    description: Paragraphs;
    details?: Details;
    /** Advanced result (12+), for a move marked advanced */
    advanced?:
      | Paragraphs
      | {
          description: Paragraphs;
          details: Details;
        };
    /** List of options to choose from */
    options?: {
      id: Id;
      description: Markdown;
    }[];
  }[];
}
