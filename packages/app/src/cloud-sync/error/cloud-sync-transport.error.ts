import * as Schema from 'effect/Schema';

export class CloudSyncTransportError extends Schema.TaggedError<CloudSyncTransportError>()('CloudSyncTransportError', {
    code: Schema.String,
    message: Schema.String
}) {}
