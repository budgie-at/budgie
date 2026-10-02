import { AccountTypeEnum, Db, InstrumentPriceProviderEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { fetchJson } from '../../@generic/util/fetch-json.util';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../repository/instrument-market-data-job.repository';

import type {
    AccountEntityInterface,
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

export class HistoricalMarketDataService extends Context.Service<HistoricalMarketDataService>()(
    '@budgie/market/HistoricalMarketDataService',
    {
        make: Effect.gen(function* () {
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const dataWindowDays = 365;
            const coinGeckoCoinsApiUrl = 'https://api.coingecko.com/api/v3/coins';
            const fetchTimeoutMs = 10_000;
            const maxAttempts = 3;
            const source = 'coingecko.com';
            const rateDateFormat = 'yyyy-MM-dd';
            const staleLockMs = 5 * 60 * 1000;
            const coinGeckoTimedValueSchema = Schema.Tuple([Schema.Number, Schema.Number]);
            const coinGeckoMarketChartResponseSchema = Schema.Struct({
                prices: Schema.Array(coinGeckoTimedValueSchema),
                market_caps: Schema.Array(coinGeckoTimedValueSchema),
                total_volumes: Schema.Array(coinGeckoTimedValueSchema)
            });

            const isSupportedInstrument = (instrument: InstrumentEntityInterface | undefined): boolean =>
                isDefined(instrument) &&
                instrument.type === InstrumentTypeEnum.CRYPTO &&
                instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO &&
                isDefined(instrument.providerInstrumentId);

            const getCandidateInstrumentIds = (
                accounts: AccountEntityInterface[],
                instrumentById: Map<number, InstrumentEntityInterface>
            ): number[] => {
                const uniqueInstrumentIds = new Set<number>();

                for (const account of accounts) {
                    const isCandidate = account.type === AccountTypeEnum.CRYPTO && !uniqueInstrumentIds.has(account.instrumentId);

                    if (isCandidate && isSupportedInstrument(instrumentById.get(account.instrumentId))) {
                        uniqueInstrumentIds.add(account.instrumentId);
                    }
                }

                return [...uniqueInstrumentIds];
            };

            const getSupportedFromDate = (fromDate: string): string => {
                const earliestDate = subDays(new Date(), dataWindowDays - 1);
                const requestedDate = parseISO(fromDate);
                const supportedDate = isAfter(requestedDate, earliestDate) ? requestedDate : earliestDate;

                return format(supportedDate, rateDateFormat);
            };

            const buildHistoricalRateInputs = (
                prices: InstrumentDailyMarketPriceCreateEntityInterface[]
            ): HistoricalExchangeRateCreateEntityInterface[] =>
                prices.flatMap(price => [
                    {
                        sourceInstrumentId: price.instrumentId,
                        targetInstrumentId: price.quoteInstrumentId,
                        rateDate: price.priceDate,
                        rate: price.price
                    },
                    {
                        sourceInstrumentId: price.quoteInstrumentId,
                        targetInstrumentId: price.instrumentId,
                        rateDate: price.priceDate,
                        rate: 1 / price.price
                    }
                ]);

            const buildTimedValueMap = (values: ReadonlyArray<readonly [number, number]>): Map<string, number> =>
                new Map(values.map(([timestamp, value]) => [format(new Date(timestamp), rateDateFormat), value]));

            const getNextMissingFromDate = Effect.fn('HistoricalMarketDataService.getNextMissingFromDate')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const latestPrice = yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId);

                if (isDefined(latestPrice)) {
                    return format(addDays(parseISO(latestPrice.priceDate), 1), rateDateFormat);
                }

                return format(subDays(new Date(), dataWindowDays - 1), rateDateFormat);
            });

            const buildAccountJobInput = Effect.fn('HistoricalMarketDataService.buildAccountJobInput')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const toDate = format(new Date(), rateDateFormat);
                const hasOpenJob = yield* instrumentMarketDataJobRepository.hasOpen(instrumentId, quoteInstrumentId);

                if (hasOpenJob) {
                    return null;
                }

                const fromDate = yield* getNextMissingFromDate(instrumentId, quoteInstrumentId);

                if (isAfter(parseISO(fromDate), parseISO(toDate))) {
                    return null;
                }

                return {
                    instrumentId,
                    quoteInstrumentId,
                    fromDate,
                    toDate,
                    priority: 10
                };
            });

            const fetchHistoricalPrices = Effect.fn('HistoricalMarketDataService.fetchHistoricalPrices')(function* (
                instrument: InstrumentEntityInterface,
                job: InstrumentMarketDataJobEntityInterface
            ) {
                if (!isDefined(instrument.providerInstrumentId)) {
                    return [];
                }

                const quoteCode = (yield* instrumentRepository.findById(job.quoteInstrumentId))?.code.toLowerCase() ?? 'usd';
                const fromDate = getSupportedFromDate(job.fromDate);

                if (isAfter(parseISO(fromDate), parseISO(job.toDate))) {
                    return [];
                }

                const data = yield* fetchJson(
                    `${coinGeckoCoinsApiUrl}/${encodeURIComponent(instrument.providerInstrumentId)}/market_chart/range`,
                    coinGeckoMarketChartResponseSchema,
                    fetchTimeoutMs,
                    {
                        vs_currency: quoteCode,
                        from: Math.floor(parseISO(fromDate).getTime() / 1000),
                        to: Math.floor(parseISO(job.toDate).getTime() / 1000)
                    }
                );

                if (!isNotEmptyArray(data.prices)) {
                    return yield* Effect.die(new Error('Market data prices missing'));
                }

                const marketCapByDate = buildTimedValueMap(data.market_caps);
                const volumeByDate = buildTimedValueMap(data.total_volumes);

                return data.prices.flatMap(([timestamp, price]): InstrumentDailyMarketPriceCreateEntityInterface[] => {
                    const priceDate = format(new Date(timestamp), rateDateFormat);

                    if (!isPositiveNumber(price)) {
                        return [];
                    }

                    return [
                        {
                            instrumentId: job.instrumentId,
                            quoteInstrumentId: job.quoteInstrumentId,
                            priceDate,
                            price,
                            marketCap: marketCapByDate.get(priceDate) ?? null,
                            volume: volumeByDate.get(priceDate) ?? null,
                            source
                        }
                    ];
                });
            });

            const enqueueAccounts = Effect.fn('HistoricalMarketDataService.enqueueAccounts')(function* (
                accounts: AccountEntityInterface[]
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return;
                }

                const instruments = yield* instrumentRepository.getAll();
                const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
                const inputs = yield* Effect.forEach(
                    getCandidateInstrumentIds(accounts, instrumentById),
                    instrumentId => buildAccountJobInput(instrumentId, baseInstrument.id),
                    { concurrency: 'unbounded' }
                );

                yield* instrumentMarketDataJobRepository.enqueueMany(inputs.filter(isDefined));
            });

            return {
                enqueueAccounts,
                claimNextJob: () => instrumentMarketDataJobRepository.claimNext(maxAttempts, new Date(Date.now() - staleLockMs)),
                fetchJobPrices: Effect.fn('HistoricalMarketDataService.fetchJobPrices')(function* (
                    job: InstrumentMarketDataJobEntityInterface
                ) {
                    const instrument = yield* instrumentRepository.findById(job.instrumentId);

                    if (!isDefined(instrument)) {
                        return yield* Effect.die(new Error('Instrument not found'));
                    }

                    return yield* fetchHistoricalPrices(instrument, job);
                }),
                storeJobPrices: (job: InstrumentMarketDataJobEntityInterface, prices: InstrumentDailyMarketPriceCreateEntityInterface[]) =>
                    Db.transaction(
                        Effect.all(
                            [
                                instrumentDailyMarketPriceRepository.bulkUpsert(prices),
                                historicalExchangeRateRepository.bulkUpsert(buildHistoricalRateInputs(prices)),
                                instrumentMarketDataJobRepository.markCompleted(job.id)
                            ],
                            { discard: true }
                        )
                    ),
                failJob: (job: InstrumentMarketDataJobEntityInterface, cause: Cause.Cause<unknown>) =>
                    instrumentMarketDataJobRepository.markFailed(job.id, getErrorMessage(Cause.squash(cause)))
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalMarketDataService, HistoricalMarketDataService.make).pipe(
        Layer.provide([
            HistoricalExchangeRateRepository.layer,
            InstrumentDailyMarketPriceRepository.layer,
            InstrumentMarketDataJobRepository.layer,
            InstrumentRepository.layer,
            ExchangeRatesService.layer
        ])
    );
}
