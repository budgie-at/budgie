import * as Schema from 'effect/Schema';

export class BinanceKeyPermissionsError extends Schema.TaggedError<BinanceKeyPermissionsError>()('BinanceKeyPermissionsError', {
    permissions: Schema.Array(Schema.String),
    message: Schema.String
}) {}
