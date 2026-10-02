import { parseISO } from 'date-fns/parseISO';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Schedule from 'effect/Schedule';

import { CoinGeckoMarketChartResponseSchema } from '../schema/coin-gecko-market-chart-response.schema';

const COINGECKO_MARKET_CHART_RANGE_API_URL = 'https://api.coingecko.com/api/v3/coins';
const FETCH_RETRY_LIMIT = 1;
const FETCH_RETRY_DELAY_MS = 300;
const FETCH_TIMEOUT_MS = 10_000;

export const coinGeckoMarketChartFetchApi = Effect.fn('coinGeckoMarketChartFetchApi')(function* (
    providerInstrumentId: string,
    quoteCode: string,
    fromDate: string,
    toDate: string
) {
    const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
        HttpClient.transformResponse(Effect.timeout(FETCH_TIMEOUT_MS)),
        HttpClient.retryTransient({
            retryOn: 'errors-only',
            times: FETCH_RETRY_LIMIT,
            schedule: Schedule.exponential(FETCH_RETRY_DELAY_MS)
        })
    );
    const response = yield* client.get(
        `${COINGECKO_MARKET_CHART_RANGE_API_URL}/${encodeURIComponent(providerInstrumentId)}/market_chart/range`,
        {
            urlParams: {
                vs_currency: quoteCode,
                from: Math.floor(parseISO(fromDate).getTime() / 1000),
                to: Math.floor(parseISO(toDate).getTime() / 1000)
            }
        }
    );

    return yield* HttpClientResponse.schemaBodyJson(CoinGeckoMarketChartResponseSchema)(response);
});
