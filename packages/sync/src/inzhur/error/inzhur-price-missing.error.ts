import * as Schema from 'effect/Schema';

export class InzhurPriceMissingError extends Schema.TaggedError<InzhurPriceMissingError, { readonly brand: unique symbol }>()(
    'InzhurPriceMissingError',
    {
        fundNames: Schema.Array(Schema.String)
    }
) {}
