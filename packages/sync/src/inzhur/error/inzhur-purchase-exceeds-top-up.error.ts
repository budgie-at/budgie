import * as Schema from 'effect/Schema';

export class InzhurPurchaseExceedsTopUpError extends Schema.TaggedError<InzhurPurchaseExceedsTopUpError>()(
    'InzhurPurchaseExceedsTopUpError',
    { remainingAmount: Schema.Number }
) {}
