/**
 * This file was automatically generated from `../basic-moves.schema.json`
 * by `./regenerate.mjs`, using `json-schema-to-typescript`.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema,
 * and run `npm run schema:types` to regenerate this file.
 */

import type {DateString, Id, Markdown, Paragraphs, Rating, SchemaVersion} from "./common.schema";

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
    type: "basic_move";
    name: string;
    rating: Rating;
    description?: Paragraphs;
    /** List of options to choose from */
    options?: {
      id: Id;
      description: Markdown;
    }[];
  }[];
}
