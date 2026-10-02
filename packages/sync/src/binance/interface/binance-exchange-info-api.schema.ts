import * as Schema from 'effect/Schema';

const BinanceExchangeInfoSymbolApiSchema = Schema.Struct({
    symbol: Schema.String,
    status: Schema.String
});

export const BinanceExchangeInfoApiSchema = Schema.Struct({
    symbols: Schema.Array(BinanceExchangeInfoSymbolApiSchema)
});
