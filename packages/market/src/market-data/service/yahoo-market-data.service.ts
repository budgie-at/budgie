import { Db, InstrumentPriceProviderEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import { subDays } from 'date-fns/subDays';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import type { YahooListingInterface } from '../interface/yahoo-listing.interface';

export class YahooMarketDataService extends Context.Service<YahooMarketDataService>()('@budgie/market/YahooMarketDataService', {
    make: Effect.gen(function* () {
        const instrumentRepository = yield* InstrumentRepository;
        const client = (yield* HttpClient.HttpClient).pipe(
            HttpClient.filterStatus(status => status === 404 || (status >= 200 && status < 300))
        );
        const listingSchema = Schema.Struct({
            symbol: Schema.String,
            quoteType: Schema.String,
            shortname: Schema.optionalKey(Schema.String),
            longname: Schema.optionalKey(Schema.String),
            exchDisp: Schema.optionalKey(Schema.String)
        });
        const chartSchema = Schema.Struct({
            chart: Schema.Struct({
                result: Schema.Struct({
                    meta: Schema.Struct({ currency: Schema.String, regularMarketPrice: Schema.optionalKey(Schema.Finite) }),
                    timestamp: Schema.Finite.pipe(Schema.Array, Schema.optionalKey),
                    indicators: Schema.Struct({
                        quote: Schema.Array(Schema.Struct({ close: Schema.Finite.pipe(Schema.NullOr, Schema.Array) }))
                    })
                }).pipe(Schema.Array, Schema.NullOr)
            })
        });
        const request = <S extends Schema.ConstraintDecoder<unknown>>(
            path: string,
            schema: S,
            urlParams: Record<string, string | number>
        ) =>
            Effect.flatMap(
                client.get(`https://query1.finance.yahoo.com/${path}`, { urlParams, headers: { 'User-Agent': 'Budgie/1.0' } }),
                HttpClientResponse.schemaBodyJson(schema)
            ).pipe(Effect.retry({ times: 2, schedule: Schedule.exponential(300) }), Effect.timeout(10000));
        const minorUnitCurrencies: Partial<Record<string, string>> = { GBp: 'GBP', GBX: 'GBP', ZAc: 'ZAR', ILA: 'ILS' };
        const chart = Effect.fn('YahooMarketDataService.chart')(function* (symbol: string, from: Date, to: Date) {
            const response = yield* request(`v8/finance/chart/${encodeURIComponent(symbol)}`, chartSchema, {
                period1: Math.floor(from.getTime() / 1000),
                period2: Math.floor(to.getTime() / 1000),
                interval: '1d'
            });

            const data = response.chart.result?.at(0);
            if (!isDefined(data)) {
                return null;
            }
            const currency = minorUnitCurrencies[data.meta.currency];
            const divisor = isDefined(currency) ? 100 : 1;

            return {
                ...data,
                meta: {
                    ...data.meta,
                    currency: currency ?? data.meta.currency,
                    ...(isDefined(data.meta.regularMarketPrice) && { regularMarketPrice: data.meta.regularMarketPrice / divisor })
                },
                indicators: {
                    quote: data.indicators.quote.map(quote => ({
                        close: quote.close.map(price => (isDefined(price) ? price / divisor : null))
                    }))
                }
            };
        });

        return {
            chart,
            search: Effect.fn('YahooMarketDataService.search')(function* (query: string) {
                const response = yield* request('v1/finance/search', Schema.Struct({ quotes: Schema.Array(listingSchema) }), {
                    ...Object.fromEntries([['q', query]]),
                    quotesCount: 10,
                    newsCount: 0
                });

                return response.quotes.flatMap((quote): YahooListingInterface[] =>
                    quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'
                        ? [
                              {
                                  symbol: quote.symbol,
                                  name: quote.longname ?? quote.shortname ?? quote.symbol,
                                  exchange: quote.exchDisp ?? '',
                                  type: quote.quoteType === 'EQUITY' ? InstrumentTypeEnum.EQUITY : InstrumentTypeEnum.ETF
                              }
                          ]
                        : []
                );
            }),
            resolveOrCreate: Effect.fn('YahooMarketDataService.resolveOrCreate')(function* (listing: YahooListingInterface, query: string) {
                const code = /^[A-Z]{2}[A-Z0-9]{9}\d$/u.test(query.trim().toUpperCase())
                    ? query.trim().toUpperCase()
                    : `YAHOO:${listing.symbol}`;
                const findExisting = Effect.gen(function* () {
                    const byProvider = yield* instrumentRepository.findByProvider(InstrumentPriceProviderEnum.YAHOO, listing.symbol);
                    const byCode = byProvider ?? (yield* instrumentRepository.findByCode(code));

                    return byCode?.priceProvider === InstrumentPriceProviderEnum.YAHOO ? byCode : null;
                });
                const existing = yield* findExisting;
                if (isDefined(existing)) {
                    return existing;
                }
                const now = yield* DateTime.nowAsDate;
                const data = yield* chart(listing.symbol, subDays(now, 7), now);
                const currency = isDefined(data) ? yield* instrumentRepository.findByCode(data.meta.currency) : null;
                if (!isDefined(currency) || currency.type !== InstrumentTypeEnum.FIAT) {
                    return yield* Effect.die(new Error('Unsupported trading currency'));
                }

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const instrument = yield* findExisting;

                        return (
                            instrument ??
                            (yield* instrumentRepository.create({
                                code,
                                name: listing.name,
                                symbol: listing.symbol.split('.').at(0) ?? listing.symbol,
                                type: listing.type,
                                priceProvider: InstrumentPriceProviderEnum.YAHOO,
                                providerInstrumentId: listing.symbol,
                                quoteInstrumentId: currency.id
                            }))
                        );
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(YahooMarketDataService, YahooMarketDataService.make).pipe(
        Layer.provide(InstrumentRepository.layer)
    );
}
