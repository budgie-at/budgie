import * as Schema from 'effect/Schema';

export class UnsupportedBackupError extends Schema.TaggedError<UnsupportedBackupError>()('UnsupportedBackupError', {}) {}
