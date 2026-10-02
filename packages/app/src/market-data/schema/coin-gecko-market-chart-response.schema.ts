import * as Schema from 'effect/Schema';

const CoinGeckoTimedValueSchema = Schema.Tuple([Schema.Number, Schema.Number]);

export const CoinGeckoMarketChartResponseSchema = Schema.Struct({
    prices: Schema.Array(CoinGeckoTimedValueSchema),
    market_caps: Schema.Array(CoinGeckoTimedValueSchema),
    total_volumes: Schema.Array(CoinGeckoTimedValueSchema)
});
