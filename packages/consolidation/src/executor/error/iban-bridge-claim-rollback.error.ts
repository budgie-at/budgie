import * as Schema from 'effect/Schema';

export class IbanBridgeClaimRollbackError extends Schema.TaggedError<IbanBridgeClaimRollbackError, { readonly brand: unique symbol }>()(
    'IbanBridgeClaimRollbackError',
    {}
) {}
