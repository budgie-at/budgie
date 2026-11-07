import * as Schema from 'effect/Schema';

export class CloudNetworkUnavailableError extends Schema.TaggedError<CloudNetworkUnavailableError, { readonly brand: unique symbol }>()(
    'CloudNetworkUnavailableError',
    {}
) {}
