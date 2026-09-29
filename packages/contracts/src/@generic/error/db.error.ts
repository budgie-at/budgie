import * as Schema from 'effect/Schema';

export class DbError extends Schema.TaggedError<DbError>()('DbError', { cause: Schema.Defect() }) {}
