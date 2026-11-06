import * as Schema from 'effect/Schema';

export class InzhurNotSetUpError extends Schema.TaggedError<InzhurNotSetUpError, { readonly brand: unique symbol }>()(
    'InzhurNotSetUpError',
    {}
) {}
