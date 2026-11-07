import * as Schema from 'effect/Schema';

export class CloudBackupUnreadableError extends Schema.TaggedError<CloudBackupUnreadableError, { readonly brand: unique symbol }>()(
    'CloudBackupUnreadableError',
    {}
) {}
