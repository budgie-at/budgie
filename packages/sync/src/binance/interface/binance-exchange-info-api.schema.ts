import * as Schema from 'effect/Schema';

const BinanceExchangeInfoSymbolApiSchema = Schema.Struct({
    symbol: Schema.String,
    baseAsset: Schema.String,
    quoteAsset: Schema.String
});

export const BinanceExchangeInfoApiSchema = Schema.Struct({
    symbols: Schema.Array(BinanceExchangeInfoSymbolApiSchema)
});
