import * as Schema from 'effect/Schema';

export const BinanceCredentialsSchema = Schema.Struct({
    apiKey: Schema.NonEmptyString,
    apiSecret: Schema.NonEmptyString
});

export type BinanceCredentialsInterface = typeof BinanceCredentialsSchema.Type;
