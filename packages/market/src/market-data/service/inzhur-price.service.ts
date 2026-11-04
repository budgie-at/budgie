import { CurrencyEnum, InstrumentRepository } from '@budgie/contracts';
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
        const isinByFundName: Record<string, string> = {
            'Inzhur REIT': 'UA5000014044',
            'Inzhur Energy': 'UA5000012246'
        };
        const certificatePricePattern =
            /&quot;value&quot;:\[0,&quot;([^&]+)&quot;\],&quot;dynamicValue&quot;:\[0,&quot;initialInvestment&quot;\],&quot;hint&quot;:\[0,&quot;(?:(?!&quot;).)*?фонду (Inzhur [A-Za-z]+)/gu;
        const certificatePriceSchema = Schema.NumberFromString.check(Schema.isGreaterThan(0));
        const parsePrices = Effect.fn('InzhurPriceService.parsePrices')(function* (html: string) {
            const matches = [...html.matchAll(certificatePricePattern)];

            if (!isNotEmptyArray(matches)) {
                return yield* new InzhurPriceParseError({ reason: 'certificate price markers not found' });
            }

            const prices = yield* Effect.forEach(matches, ([, rawPrice = '', fundName = '']) =>
                Schema.decodeUnknownEffect(certificatePriceSchema)(rawPrice).pipe(
                    Effect.mapError(() => new InzhurPriceParseError({ reason: `invalid price "${rawPrice}" for ${fundName}` })),
                    Effect.map((price): InzhurFundPriceInterface | null => {
                        const isin = isinByFundName[fundName];

                        return isDefined(isin) ? { isin, price } : null;
                    })
                )
            );
            const knownPrices = prices.filter(isDefined);

            if (!isNotEmptyArray(knownPrices)) {
                return yield* new InzhurPriceParseError({ reason: 'no known fund found on the page' });
            }

            return knownPrices;
        });

        return {
            fetchPrices: Effect.fn('InzhurPriceService.fetchPrices')(function* () {
                const client = (yield* HttpClient.HttpClient).pipe(
                    HttpClient.filterStatusOk,
                    HttpClient.transformResponse(Effect.timeout(fetchTimeoutMs)),
                    HttpClient.retryTransient({ retryOn: 'errors-only', times: 2, schedule: Schedule.exponential(500) })
                );
                const response = yield* client.get(pageUrl);

                return yield* parsePrices(yield* response.text);
            }),
            findPriceOnOrBefore: Effect.fn('InzhurPriceService.findPriceOnOrBefore')(function* (instrumentId: number, priceDate: string) {
                const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);

                if (!isDefined(hryvnia)) {
                    return null;
                }

                const price = yield* instrumentDailyMarketPriceRepository.findForDateOrBefore(instrumentId, hryvnia.id, priceDate);

                return price?.price ?? null;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurPriceService, InzhurPriceService.make).pipe(
        Layer.provide([InstrumentDailyMarketPriceRepository.layer, InstrumentRepository.layer])
    );
}
