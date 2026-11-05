import * as Schema from 'effect/Schema';

export class PinAttemptStorageError extends Schema.TaggedError<PinAttemptStorageError, { readonly brand: unique symbol }>()(
    'PinAttemptStorageError',
    {
        cause: Schema.Defect()
    }
) {}
