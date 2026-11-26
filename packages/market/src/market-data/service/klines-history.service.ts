import { CurrencyEnum, InstrumentRepository, TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { USDT_INSTRUMENT_CODE } from '../../@generic/constant/usdt-instrument-code.constant';
import { STABLECOIN_CODES } from '../../valuation/constant/stablecoin-codes.constant';
import { InstrumentDailyMarketPriceRepository } from '../repository/instrument-daily-market-price.repository';
import { buildHistoricalRateInputs } from '../utils/build-historical-rate-inputs.util';

import { BinanceKlinesClient } from './binance-klines-client.service';

import type { MarketDataJobResultInterface } from '../interface/market-data-job-result.interface';
import type {
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobCreateEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

export class KlinesHistoryService extends Context.Service<KlinesHistoryService>()('@budgie/market/KlinesHistoryService', {
    make: Effect.gen(function* () {
        const binanceKlinesClient = yield* BinanceKlinesClient;
        const instrumentRepository = yield* InstrumentRepository;
        const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const transactionEntryBaseValuationRepository = yield* TransactionEntryBaseValuationRepository;
        const source = 'binance.vision';
        const klinesJobPriority = 1;
        const euroOpensCacheCapacity = 64;
        const euroOpensCacheTtl = '10 minutes';
        const euroOpensCache = yield* Cache.makeWith(
            (windowKey: string) => {
                const [fromDate = '', toDate = ''] = windowKey.split(':');

                return binanceKlinesClient.fetchEuroDailyOpens(fromDate, toDate);
            },
            {
                capacity: euroOpensCacheCapacity,
                timeToLive: exit => (Exit.isSuccess(exit) ? euroOpensCacheTtl : '0 millis')
            }
        );

        return {
            findUsdtInstrument: instrumentRepository.findByCode(USDT_INSTRUMENT_CODE),
            buildJobInput: Effect.fn('KlinesHistoryService.buildJobInput')(function* (
                instrumentId: number,
                baseInstrumentId: number,
                usdtInstrumentId: number
            ) {
                const instrument = yield* instrumentRepository.findById(instrumentId);

                if (!isDefined(instrument) || STABLECOIN_CODES.has(instrument.code)) {
                    return null;
                }

                const earliestPrice = yield* instrumentDailyMarketPriceRepository.findEarliest(instrumentId, baseInstrumentId);
                const oldestEntryDate = yield* transactionEntryBaseValuationRepository.findOldestMarketPricedEntryDate(instrumentId);

                if (!isDefined(earliestPrice) || !isDefined(oldestEntryDate)) {
                    return null;
                }

                const toDate = format(subDays(parseISO(earliestPrice.priceDate), 1), 'yyyy-MM-dd');
                const jobInput: InstrumentMarketDataJobCreateEntityInterface = {
                    instrumentId,
                    quoteInstrumentId: usdtInstrumentId,
                    fromDate: oldestEntryDate,
                    toDate,
                    priority: klinesJobPriority
                };

                return oldestEntryDate > toDate ? null : jobInput;
            }),
            fetchJobData: Effect.fn('KlinesHistoryService.fetchJobData')(function* (
                instrument: InstrumentEntityInterface,
                job: InstrumentMarketDataJobEntityInterface
            ) {
                const euro = yield* instrumentRepository.findByCode(CurrencyEnum.EUR);
                const fetchInstrumentOpens = Effect.catchTag(
                    binanceKlinesClient.fetchInstrumentDailyOpens(instrument.code, job.fromDate, job.toDate),
                    'BinanceKlinesInvalidSymbolError',
                    () => Effect.succeed(null)
                );
                const fetchEuroOpens = isDefined(euro) ? Cache.get(euroOpensCache, `${job.fromDate}:${job.toDate}`) : Effect.succeed([]);
                const [opens, euroOpens] = yield* Effect.all([fetchInstrumentOpens, fetchEuroOpens], { concurrency: 2 });

                if (!isDefined(opens)) {
                    const unsupported: MarketDataJobResultInterface = { prices: [], rates: [], unsupportedInstruments: [instrument] };

                    return unsupported;
                }

                const toPrice = (instrumentId: number, open: (typeof opens)[number]): InstrumentDailyMarketPriceCreateEntityInterface => ({
                    instrumentId,
                    quoteInstrumentId: job.quoteInstrumentId,
                    priceDate: open.priceDate,
                    price: open.price,
                    marketCap: null,
                    volume: null,
                    source
                });
                const prices = opens.map(open => toPrice(job.instrumentId, open));
                const euroPrices = isDefined(euro) ? euroOpens.map(open => toPrice(euro.id, open)) : [];
                const result: MarketDataJobResultInterface = {
                    prices,
                    rates: buildHistoricalRateInputs([...prices, ...euroPrices]),
                    unsupportedInstruments: []
                };

                return result;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(KlinesHistoryService, KlinesHistoryService.make).pipe(
        Layer.provide([
            BinanceKlinesClient.layer,
            InstrumentRepository.layer,
            InstrumentDailyMarketPriceRepository.layer,
            TransactionEntryBaseValuationRepository.layer
        ])
    );
}
