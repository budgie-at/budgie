import * as Schema from 'effect/Schema';

export class InsufficientSecurityHoldingError extends Schema.TaggedError<
    InsufficientSecurityHoldingError,
    { readonly brand: unique symbol }
>()('InsufficientSecurityHoldingError', {}) {}
