import * as Schema from 'effect/Schema';

export class RefundAlreadyConsolidatedError extends Schema.TaggedError<RefundAlreadyConsolidatedError, { readonly brand: unique symbol }>()(
    'RefundAlreadyConsolidatedError',
    {}
) {
    override get message(): string {
        return 'Selected transaction is already consolidated';
    }
}
