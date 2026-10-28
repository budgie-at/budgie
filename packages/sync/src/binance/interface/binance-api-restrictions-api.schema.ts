import * as Schema from 'effect/Schema';

export const BinanceApiRestrictionsApiSchema = Schema.Struct({
    enableSpotAndMarginTrading: Schema.Boolean,
    enableWithdrawals: Schema.Boolean,
    enableInternalTransfer: Schema.Boolean,
    permitsUniversalTransfer: Schema.Boolean,
    enableMargin: Schema.Boolean,
    enableFutures: Schema.Boolean
});

export type BinanceApiRestrictionsApiInterface = typeof BinanceApiRestrictionsApiSchema.Type;
