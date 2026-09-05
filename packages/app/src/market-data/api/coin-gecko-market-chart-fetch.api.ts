import { parseISO } from 'date-fns/parseISO';
import ky from 'ky';
import { z } from 'zod';

import { CoinGeckoMarketChartResponseSchema } from '../schema/coin-gecko-market-chart-response.schema';

const COINGECKO_MARKET_CHART_RANGE_API_URL = 'https://api.coingecko.com/api/v3/coins';
const FETCH_RETRY_LIMIT = 1;
const FETCH_TIMEOUT_MS = 10_000;
const HTTP_CLIENT = ky.create({
    timeout: FETCH_TIMEOUT_MS,
    retry: {
        limit: FETCH_RETRY_LIMIT,
        retryOnTimeout: true
    }
});

export const coinGeckoMarketChartFetchApi = async (
    providerInstrumentId: string,
    quoteCode: string,
    fromDate: string,
    toDate: string
): Promise<z.infer<typeof CoinGeckoMarketChartResponseSchema>> => {
    const payload = await HTTP_CLIENT.get(
        `${COINGECKO_MARKET_CHART_RANGE_API_URL}/${encodeURIComponent(providerInstrumentId)}/market_chart/range`,
        {
            searchParams: {
                vs_currency: quoteCode,
                from: Math.floor(parseISO(fromDate).getTime() / 1000),
                to: Math.floor(parseISO(toDate).getTime() / 1000)
            }
        }
    ).json();
    const result = CoinGeckoMarketChartResponseSchema.safeParse(payload);

    if (!result.success) {
        throw new Error(result.error.message);
    }

    return result.data;
};
