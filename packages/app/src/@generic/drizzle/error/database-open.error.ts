import * as Schema from 'effect/Schema';

export class DatabaseOpenError extends Schema.TaggedError<DatabaseOpenError>()('DatabaseOpenError', { cause: Schema.Defect() }) {}
