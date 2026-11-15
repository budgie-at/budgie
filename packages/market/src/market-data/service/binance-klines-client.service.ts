import { BINANCE_ASSET_ALIAS } from '@budgie/contracts';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';
import * as Predicate from 'effect/Predicate';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { formatUtcDay } from '../../@generic/utils/format-utc-day.util';
import { BinanceKlinesInvalidSymbolError } from '../error/binance-klines-invalid-symbol.error';

import type { DailyOpenPriceInterface } from '../interface/daily-open-price.interface';

export class BinanceKlinesClient extends Context.Service<BinanceKlinesClient>()('@budgie/market/BinanceKlinesClient', {
    make: Effect.gen(function* () {
        const httpClient = yield* HttpClient.HttpClient;
        const klinesUrl = 'https://data-api.binance.vision/api/v3/klines';
        const quoteCode = 'USDT';
        const euroSymbol = 'EURUSDT';
        const pageDays = 1000;
        const dayMs = 86_400_000;
        const fetchTimeoutMs = 10_000;
        const invalidSymbolCode = -1121;
        const klinesSchema = Schema.Array(Schema.TupleWithRest(Schema.Tuple([Schema.Finite, Schema.FiniteFromString]), [Schema.Unknown]));
        const errorBodySchema = Schema.Struct({ code: Schema.Finite });

        const toDayStartMs = (day: string): number => Date.parse(`${day}T00:00:00.000Z`);

        const legacyCodesOf = (instrumentCode: string): string[] =>
            Object.entries(BINANCE_ASSET_ALIAS)
                .filter(([, aliasedCode]) => aliasedCode === instrumentCode)
                .map(([legacyCode]) => legacyCode);

        const fetchPage = Effect.fnUntraced(function* (symbol: string, startTime: number, endTime: number) {
            const response = yield* httpClient
                .get(klinesUrl, { urlParams: { symbol, interval: '1d', startTime, endTime, limit: pageDays } })
                .pipe(Effect.timeout(fetchTimeoutMs));

            if (response.status === 400) {
                const body = yield* HttpClientResponse.schemaBodyJson(errorBodySchema)(response);

                if (body.code === invalidSymbolCode) {
                    return yield* BinanceKlinesInvalidSymbolError.make({ symbol });
                }
            }

            const okResponse = yield* HttpClientResponse.filterStatusOk(response);

            return yield* HttpClientResponse.schemaBodyJson(klinesSchema)(okResponse);
        });

        const fetchSymbol = Effect.fnUntraced(function* (symbol: string, fromDate: string, toDate: string) {
            const fromMs = toDayStartMs(fromDate);
            const toMs = toDayStartMs(toDate);
            const pageStarts = Arr.makeBy(Math.floor((toMs - fromMs) / (pageDays * dayMs)) + 1, index => fromMs + index * pageDays * dayMs);
            const pages = yield* Effect.forEach(pageStarts, startTime =>
                fetchPage(symbol, startTime, Math.min(startTime + (pageDays - 1) * dayMs, toMs)).pipe(
                    Effect.retry({
                        times: 3,
                        schedule: Schedule.exponential('500 millis'),
                        while: error => !Predicate.isTagged(error, 'BinanceKlinesInvalidSymbolError')
                    })
                )
            );

            return pages
                .flat()
                .map(([openTime, open]): DailyOpenPriceInterface => ({ priceDate: formatUtcDay(new Date(openTime)), price: open }));
        });

        const fetchSymbolOrNull = (symbol: string, fromDate: string, toDate: string) =>
            fetchSymbol(symbol, fromDate, toDate).pipe(Effect.catchTag('BinanceKlinesInvalidSymbolError', () => Effect.succeed(null)));

        return {
            fetchInstrumentDailyOpens: Effect.fn('BinanceKlinesClient.fetchInstrumentDailyOpens')(function* (
                instrumentCode: string,
                fromDate: string,
                toDate: string
            ) {
                const symbols = [instrumentCode, ...legacyCodesOf(instrumentCode)].map(code => `${code}${quoteCode}`);
                const fetched = (yield* Effect.forEach(symbols, symbol => fetchSymbolOrNull(symbol, fromDate, toDate))).filter(isDefined);

                if (!isNotEmptyArray(fetched)) {
                    return yield* BinanceKlinesInvalidSymbolError.make({ symbol: symbols.join(',') });
                }

                const priceByDate = new Map<string, number>();

                for (const prices of fetched.toReversed()) {
                    for (const { priceDate, price } of prices) {
                        priceByDate.set(priceDate, price);
                    }
                }

                return [...priceByDate]
                    .sort(([left], [right]) => left.localeCompare(right))
                    .map(([priceDate, price]): DailyOpenPriceInterface => ({ priceDate, price }));
            }),
            fetchEuroDailyOpens: (fromDate: string, toDate: string) =>
                Effect.map(fetchSymbolOrNull(euroSymbol, fromDate, toDate), prices => prices ?? [])
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceKlinesClient, BinanceKlinesClient.make);
}
