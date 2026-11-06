import * as Schema from 'effect/Schema';

export class RefundNotFromIncomeError extends Schema.TaggedError<RefundNotFromIncomeError, { readonly brand: unique symbol }>()(
    'RefundNotFromIncomeError',
    {}
) {
    override get message(): string {
        return 'Refund conversion starts from an income';
    }
}
