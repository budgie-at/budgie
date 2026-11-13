import { CurrencyEnum, InstrumentRepository, TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { USDT_INSTRUMENT_CODE } from '../../@generic/constant/usdt-instrument-code.constant';
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

        return {
            findUsdtInstrument: instrumentRepository.findByCode(USDT_INSTRUMENT_CODE),
            buildJobInput: Effect.fn('KlinesHistoryService.buildJobInput')(function* (
                instrumentId: number,
                baseInstrumentId: number,
                usdtInstrumentId: number
            ) {
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
                const opens = yield* binanceKlinesClient
                    .fetchInstrumentDailyOpens(instrument.code, job.fromDate, job.toDate)
                    .pipe(Effect.catchTag('BinanceKlinesInvalidSymbolError', () => Effect.succeed(null)));

                if (!isDefined(opens)) {
                    const unsupported: MarketDataJobResultInterface = { prices: [], rates: [], unsupportedInstruments: [instrument] };

                    return unsupported;
                }

                const euro = yield* instrumentRepository.findByCode(CurrencyEnum.EUR);
                const euroOpens = isDefined(euro) ? yield* binanceKlinesClient.fetchEuroDailyOpens(job.fromDate, job.toDate) : [];
                const prices = opens.map((open): InstrumentDailyMarketPriceCreateEntityInterface => ({
                    instrumentId: job.instrumentId,
                    quoteInstrumentId: job.quoteInstrumentId,
                    priceDate: open.priceDate,
                    price: open.price,
                    marketCap: null,
                    volume: null,
                    source
                }));
                const euroPrices = isDefined(euro)
                    ? euroOpens.map(open => ({
                          instrumentId: euro.id,
                          quoteInstrumentId: job.quoteInstrumentId,
                          priceDate: open.priceDate,
                          price: open.price
                      }))
                    : [];
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
