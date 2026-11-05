import * as Schema from 'effect/Schema';

export class RecurringTransactionNotFoundError extends Schema.TaggedError<RecurringTransactionNotFoundError>()(
    'RecurringTransactionNotFoundError',
    { transactionId: Schema.Number }
) {}
