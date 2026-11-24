// Generated from ../basic-moves.schema.json (npm run schema:types): edit the schema, not this.

import type {Date, Id, Markdown, Paragraphs, Rating, SchemaVersion} from "./common.schema";

/**
 * The moves every hunter has.
 */
export interface BasicMoves {
  /**
   * This file's schema, for editors.
   */
  $schema?: string;
  schema_version: SchemaVersion;
  updated: Date;
  id: "basic_moves";
  type: "basic_moves";
  name: string;
  options: {
    id?: Id;
    type: "basic_move";
    name: string;
    rating: Rating;
    description?: Paragraphs;
    /**
     * Use magic's effects.
     */
    options?: {
      id: Id;
      description: Markdown;
    }[];
  }[];
}
