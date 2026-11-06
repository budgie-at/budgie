import * as Schema from 'effect/Schema';

export class RefundExceedsExpenseError extends Schema.TaggedError<RefundExceedsExpenseError, { readonly brand: unique symbol }>()(
    'RefundExceedsExpenseError',
    {}
) {
    override get message(): string {
        return 'Refund amount cannot exceed the expense';
    }
}
