import * as Schema from 'effect/Schema';

export class CloudAccountUnavailableError extends Schema.TaggedError<CloudAccountUnavailableError>()('CloudAccountUnavailableError', {}) {}
