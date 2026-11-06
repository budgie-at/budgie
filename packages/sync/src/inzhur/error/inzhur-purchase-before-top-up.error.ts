import * as Schema from 'effect/Schema';

export class InzhurPurchaseBeforeTopUpError extends Schema.TaggedError<InzhurPurchaseBeforeTopUpError, { readonly brand: unique symbol }>()(
    'InzhurPurchaseBeforeTopUpError',
    {}
) {}
