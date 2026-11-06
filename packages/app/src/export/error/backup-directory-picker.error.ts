import * as Schema from 'effect/Schema';

export class BackupDirectoryPickerError extends Schema.TaggedError<BackupDirectoryPickerError, { readonly brand: unique symbol }>()(
    'BackupDirectoryPickerError',
    {
        cause: Schema.Defect()
    }
) {}
