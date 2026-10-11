import * as Schema from 'effect/Schema';

export class BackupArchiveMissingDatabaseError extends Schema.TaggedError<BackupArchiveMissingDatabaseError>()(
    'BackupArchiveMissingDatabaseError',
    {}
) {}
