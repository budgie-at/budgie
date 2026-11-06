import * as Schema from 'effect/Schema';

export class RecurringTransactionNotFoundError extends Schema.TaggedError<
    RecurringTransactionNotFoundError,
    { readonly brand: unique symbol }
>()('RecurringTransactionNotFoundError', { transactionId: Schema.Finite }) {}
