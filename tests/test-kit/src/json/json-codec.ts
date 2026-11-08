import * as Schema from 'effect/Schema';

const unknownJson = Schema.fromJsonString(Schema.Unknown);

export const encodeJson = Schema.encodeSync(unknownJson);

export const decodeJson = Schema.decodeSync(unknownJson);
