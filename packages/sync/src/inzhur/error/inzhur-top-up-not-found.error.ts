import * as Schema from 'effect/Schema';

export class InzhurTopUpNotFoundError extends Schema.TaggedError<InzhurTopUpNotFoundError>()('InzhurTopUpNotFoundError', {
    topUpTransactionId: Schema.Number
}) {}
