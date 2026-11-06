import * as Schema from 'effect/Schema';

export class BinanceKeyPermissionsError extends Schema.TaggedError<BinanceKeyPermissionsError, { readonly brand: unique symbol }>()(
    'BinanceKeyPermissionsError',
    {
        permissions: Schema.Array(Schema.String),
        message: Schema.String
    }
) {}
