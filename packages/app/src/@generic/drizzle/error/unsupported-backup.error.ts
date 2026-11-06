import * as Schema from 'effect/Schema';

export class UnsupportedBackupError extends Schema.TaggedError<UnsupportedBackupError, { readonly brand: unique symbol }>()(
    'UnsupportedBackupError',
    {}
) {}
