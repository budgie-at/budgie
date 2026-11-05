import * as Schema from 'effect/Schema';

export class CloudNetworkUnavailableError extends Schema.TaggedError<CloudNetworkUnavailableError>()('CloudNetworkUnavailableError', {}) {}
