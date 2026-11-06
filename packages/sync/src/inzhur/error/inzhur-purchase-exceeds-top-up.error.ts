import * as Schema from 'effect/Schema';

export class InzhurPurchaseExceedsTopUpError extends Schema.TaggedError<
    InzhurPurchaseExceedsTopUpError,
    { readonly brand: unique symbol }
>()('InzhurPurchaseExceedsTopUpError', { remainingAmount: Schema.Finite }) {}
