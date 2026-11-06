import * as Schema from 'effect/Schema';

export class InzhurStatementInvalidError extends Schema.TaggedError<InzhurStatementInvalidError, { readonly brand: unique symbol }>()(
    'InzhurStatementInvalidError',
    {
        reason: Schema.String
    }
) {}
