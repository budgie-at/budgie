import * as Schema from 'effect/Schema';

export const BinanceApiRestrictionsApiSchema = Schema.Struct({
    enableSpotAndMarginTrading: Schema.optional(Schema.Boolean),
    enableWithdrawals: Schema.optional(Schema.Boolean),
    enableInternalTransfer: Schema.optional(Schema.Boolean),
    permitsUniversalTransfer: Schema.optional(Schema.Boolean),
    enableMargin: Schema.optional(Schema.Boolean),
    enableFutures: Schema.optional(Schema.Boolean),
    enableVanillaOptions: Schema.optional(Schema.Boolean),
    enablePortfolioMarginTrading: Schema.optional(Schema.Boolean)
});

export type BinanceApiRestrictionsApiInterface = typeof BinanceApiRestrictionsApiSchema.Type;
