import * as Schema from 'effect/Schema';

export class InzhurTopUpNotFoundError extends Schema.TaggedError<InzhurTopUpNotFoundError, { readonly brand: unique symbol }>()(
    'InzhurTopUpNotFoundError',
    {
        topUpTransactionId: Schema.Finite
    }
) {}
