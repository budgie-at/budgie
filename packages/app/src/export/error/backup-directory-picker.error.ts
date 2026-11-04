import * as Schema from 'effect/Schema';

export class BackupDirectoryPickerError extends Schema.TaggedError<BackupDirectoryPickerError>()('BackupDirectoryPickerError', {
    cause: Schema.Defect()
}) {}
