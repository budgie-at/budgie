import * as Schema from 'effect/Schema';

export class InsufficientStorageError extends Schema.TaggedError<InsufficientStorageError>()('InsufficientStorageError', {}) {}
