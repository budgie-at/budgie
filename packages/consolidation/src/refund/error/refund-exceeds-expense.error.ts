import * as Schema from 'effect/Schema';

export class RefundExceedsExpenseError extends Schema.TaggedError<RefundExceedsExpenseError>()('RefundExceedsExpenseError', {}) {
    override get message(): string {
        return 'Refund amount cannot exceed the expense';
    }
}
