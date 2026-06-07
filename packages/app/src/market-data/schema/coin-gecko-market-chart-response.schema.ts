import { array, number, object, tuple } from 'zod';

const CoinGeckoTimedValueSchema = tuple([number(), number()]);

export const CoinGeckoMarketChartResponseSchema = object({
    prices: array(CoinGeckoTimedValueSchema),
    market_caps: array(CoinGeckoTimedValueSchema),
    total_volumes: array(CoinGeckoTimedValueSchema)
});
