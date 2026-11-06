import { CurrencyEnum, InstrumentRepository } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { InzhurPriceParseError } from '../error/inzhur-price-parse.error';
import { InstrumentDailyMarketPriceRepository } from '../repository/instrument-daily-market-price.repository';

import type { InzhurFundPriceInterface } from '../interface/inzhur-fund-price.interface';

export class InzhurPriceService extends Context.Service<InzhurPriceService>()('@budgie/market/InzhurPriceService', {
    make: Effect.gen(function* () {
        const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const pageUrl = 'https://www.inzhur.reit/';
        const fetchTimeoutMs = 15_000;
        const certificatePricePattern =
            /&quot;value&quot;:\[0,&quot;([^&]+)&quot;\],&quot;dynamicValue&quot;:\[0,&quot;initialInvestment&quot;\],&quot;hint&quot;:\[0,&quot;(?:(?!&quot;).)*?фонду (Inzhur [A-Za-z]+)/gu;
        const certificatePriceSchema = Schema.FiniteFromString.check(Schema.isGreaterThan(0));
        const parsePrices = Effect.fn('InzhurPriceService.parsePrices')(function* (html: string) {
            const matches = [...html.matchAll(certificatePricePattern)];

            if (!isNotEmptyArray(matches)) {
                return yield* InzhurPriceParseError.make({ reason: 'certificate price markers not found' });
            }

            const prices = yield* Effect.forEach(matches, ([, rawPrice = '', fundName = '']) =>
                Schema.decodeEffect(certificatePriceSchema)(rawPrice).pipe(
                    Effect.mapBoth({
                        onFailure: () => InzhurPriceParseError.make({ reason: `invalid price "${rawPrice}" for ${fundName}` }),
                        onSuccess: (price): InzhurFundPriceInterface => ({ fundName, price })
                    })
                )
            );

            return prices;
        });

        const fetchPrices = yield* Effect.cachedWithTTL(
            Effect.gen(function* () {
                const client = (yield* HttpClient.HttpClient).pipe(
                    HttpClient.filterStatusOk,
                    HttpClient.transformResponse(Effect.timeout(fetchTimeoutMs)),
                    HttpClient.retryTransient({ retryOn: 'errors-only', times: 2, schedule: Schedule.exponential(500) })
                );
                const response = yield* client.get(pageUrl);

                const html = yield* response.text;

                return yield* parsePrices(html);
            }).pipe(Effect.withSpan('InzhurPriceService.fetchPrices')),
            '1 minute'
        );

        return {
            fetchPrices,
            findNearestPrice: Effect.fn('InzhurPriceService.findNearestPrice')(function* (instrumentId: number, priceDate: string) {
                const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);

                if (!isDefined(hryvnia)) {
                    return null;
                }

                const [before, after] = yield* Effect.all([
                    instrumentDailyMarketPriceRepository.findForDateOrBefore(instrumentId, hryvnia.id, priceDate),
                    instrumentDailyMarketPriceRepository.findForDateOrAfter(instrumentId, hryvnia.id, priceDate)
                ]);
                const distanceInDays = (price: { readonly priceDate: string } | undefined) =>
                    isDefined(price) ? Math.abs(differenceInCalendarDays(price.priceDate, priceDate)) : Number.POSITIVE_INFINITY;
                const nearest = distanceInDays(before) <= distanceInDays(after) ? before : after;

                return nearest?.price ?? null;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurPriceService, InzhurPriceService.make).pipe(
        Layer.provide([InstrumentDailyMarketPriceRepository.layer, InstrumentRepository.layer])
    );
}
