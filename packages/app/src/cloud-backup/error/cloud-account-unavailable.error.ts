import * as Schema from 'effect/Schema';

export class CloudAccountUnavailableError extends Schema.TaggedError<CloudAccountUnavailableError, { readonly brand: unique symbol }>()(
    'CloudAccountUnavailableError',
    {}
) {}
