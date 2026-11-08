import * as Schema from 'effect/Schema';

export const SYNC_CHANGED_COLUMNS_SCHEMA = Schema.String.pipe(Schema.Array, Schema.fromJsonString);
