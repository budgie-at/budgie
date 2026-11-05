import * as Schema from 'effect/Schema';

export class BackupKeyUnavailableError extends Schema.TaggedError<BackupKeyUnavailableError>()('BackupKeyUnavailableError', {}) {}
