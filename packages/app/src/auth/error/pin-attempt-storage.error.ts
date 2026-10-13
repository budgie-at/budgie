import * as Schema from 'effect/Schema';

export class PinAttemptStorageError extends Schema.TaggedError<PinAttemptStorageError>()('PinAttemptStorageError', {
    cause: Schema.Defect()
}) {}
