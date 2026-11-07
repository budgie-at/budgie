import * as Schema from 'effect/Schema';

export const SYNC_JSON_UNKNOWN_SCHEMA = Schema.Unknown.pipe(Schema.fromJsonString);
