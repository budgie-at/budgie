import * as Schema from 'effect/Schema';

const BinanceAssetBalanceApiSchema = Schema.Struct({
    asset: Schema.String,
    free: Schema.String,
    locked: Schema.String,
    freeze: Schema.optional(Schema.String),
    withdrawing: Schema.optional(Schema.String),
    ipoable: Schema.optional(Schema.String)
});

export const BinanceAssetBalanceListApiSchema = Schema.Array(BinanceAssetBalanceApiSchema);

export type BinanceAssetBalanceApiInterface = typeof BinanceAssetBalanceApiSchema.Type;
