import * as Schema from 'effect/Schema';

export class DatabaseOpenError extends Schema.TaggedError<DatabaseOpenError, { readonly brand: unique symbol }>()('DatabaseOpenError', {
    cause: Schema.Defect()
}) {}
