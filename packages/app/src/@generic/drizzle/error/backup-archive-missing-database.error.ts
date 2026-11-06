import * as Schema from 'effect/Schema';

export class BackupArchiveMissingDatabaseError extends Schema.TaggedError<
    BackupArchiveMissingDatabaseError,
    { readonly brand: unique symbol }
>()('BackupArchiveMissingDatabaseError', {}) {}
