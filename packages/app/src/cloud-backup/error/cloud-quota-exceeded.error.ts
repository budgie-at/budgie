import * as Schema from 'effect/Schema';

export class CloudQuotaExceededError extends Schema.TaggedError<CloudQuotaExceededError, { readonly brand: unique symbol }>()(
    'CloudQuotaExceededError',
    {}
) {}
