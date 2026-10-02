import * as Schema from 'effect/Schema';

export class RefundNotFromIncomeError extends Schema.TaggedError<RefundNotFromIncomeError>()('RefundNotFromIncomeError', {}) {
    override get message(): string {
        return 'Refund conversion starts from an income';
    }
}
