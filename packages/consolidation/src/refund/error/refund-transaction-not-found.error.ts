import * as Schema from 'effect/Schema';

export class RefundTransactionNotFoundError extends Schema.TaggedError<RefundTransactionNotFoundError>()(
    'RefundTransactionNotFoundError',
    {}
) {
    override get message(): string {
        return 'Transaction not found';
    }
}
