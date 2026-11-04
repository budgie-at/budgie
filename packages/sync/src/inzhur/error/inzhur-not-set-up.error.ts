import * as Schema from 'effect/Schema';

export class InzhurNotSetUpError extends Schema.TaggedError<InzhurNotSetUpError>()('InzhurNotSetUpError', {}) {}
