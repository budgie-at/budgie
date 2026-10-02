import {
    AccountRepository,
    AccountTypeEnum,
    Db,
    HistoricalExchangeRateRepository,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobRepository,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { coinGeckoMarketChartFetchApi } from '../api/coin-gecko-market-chart-fetch.api';

import type {
    AccountEntityInterface,
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

export class HistoricalMarketDataLoaderService extends Context.Service<HistoricalMarketDataLoaderService>()(
    '@budgie/app/HistoricalMarketDataLoaderService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const accountRepository = yield* AccountRepository;
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const dataWindowDays = 365;
            const drainDelayMs = 500;
            const drainKey = 'historical-market-data';
            const maxAttempts = 3;
            const source = 'coingecko.com';
            const rateDateFormat = 'yyyy-MM-dd';
            const staleLockMs = 5 * 60 * 1000;

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
            ): HistoricalExchangeRateCreateEntityInterface[] => {
                if (!isNotEmptyArray(prices)) {
                    return [];
                }

                return prices.flatMap(price => [
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
            };

            const buildTimedValueMap = (values: ReadonlyArray<readonly [number, number]>): Map<string, number> =>
                new Map(values.map(([timestamp, value]) => [format(new Date(timestamp), rateDateFormat), value]));

            const getNextMissingFromDate = Effect.fn('HistoricalMarketDataLoaderService.getNextMissingFromDate')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const latestPrice = yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId);

                if (isDefined(latestPrice)) {
                    return format(addDays(parseISO(latestPrice.priceDate), 1), rateDateFormat);
                }

                return format(subDays(new Date(), dataWindowDays - 1), rateDateFormat);
            });

            const buildAccountJobInput = Effect.fn('HistoricalMarketDataLoaderService.buildAccountJobInput')(function* (
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

            const fetchHistoricalPrices = Effect.fn('HistoricalMarketDataLoaderService.fetchHistoricalPrices')(function* (
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

                const data = yield* coinGeckoMarketChartFetchApi(instrument.providerInstrumentId, quoteCode, fromDate, job.toDate);

                if (!isNotEmptyArray(data.prices)) {
                    return yield* Effect.die(new Error(t`Market data prices missing`));
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

            const processJob = Effect.fn('HistoricalMarketDataLoaderService.processJob')(function* (
                job: InstrumentMarketDataJobEntityInterface
            ) {
                const instrument = yield* instrumentRepository.findById(job.instrumentId);

                if (!isDefined(instrument)) {
                    return yield* Effect.die(new Error(t`Instrument not found`));
                }

                const prices = yield* fetchHistoricalPrices(instrument, job);

                return yield* workload.run(
                    Db.transaction(
                        Effect.all(
                            [
                                instrumentDailyMarketPriceRepository.bulkUpsert(prices),
                                historicalExchangeRateRepository.bulkUpsert(buildHistoricalRateInputs(prices)),
                                instrumentMarketDataJobRepository.markCompleted(job.id)
                            ],
                            { discard: true }
                        )
                    )
                );
            });

            const drainNextJob = Effect.fn('HistoricalMarketDataLoaderService.drainNextJob')(function* () {
                const staleLockedBefore = new Date(Date.now() - staleLockMs);
                const job = yield* workload.run(instrumentMarketDataJobRepository.claimNext(maxAttempts, staleLockedBefore));

                if (!isDefined(job)) {
                    return false;
                }

                yield* processJob(job).pipe(
                    Effect.catchCause(cause =>
                        workload.run(instrumentMarketDataJobRepository.markFailed(job.id, getErrorMessage(Cause.squash(cause))))
                    )
                );

                return true;
            });

            const scheduleDrain = Effect.fn('HistoricalMarketDataLoaderService.scheduleDrain')(function* () {
                yield* workload.schedule(
                    drainKey,
                    Effect.sleep(drainDelayMs).pipe(
                        Effect.andThen(waitForIdle),
                        Effect.andThen(drainNextJob()),
                        Effect.repeat({ while: shouldContinue => shouldContinue }),
                        Effect.catch(Effect.logError)
                    )
                );
            });

            const enqueueAccounts = Effect.fn('HistoricalMarketDataLoaderService.enqueueAccounts')(function* (
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
                yield* scheduleDrain();
            });

            return {
                enqueueAccounts,
                scheduleDrain,
                enqueueActiveAccounts: Effect.fn('HistoricalMarketDataLoaderService.enqueueActiveAccounts')(function* () {
                    const accounts = yield* accountRepository.getAllActiveAccounts();

                    yield* enqueueAccounts(accounts);
                }),
                cancelScheduledDrain: Effect.fn('HistoricalMarketDataLoaderService.cancelScheduledDrain')(function* () {
                    yield* workload.cancelScheduled(drainKey);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalMarketDataLoaderService, HistoricalMarketDataLoaderService.make).pipe(
        Layer.provide([
            Workload.layer,
            AccountRepository.layer,
            HistoricalExchangeRateRepository.layer,
            InstrumentDailyMarketPriceRepository.layer,
            InstrumentMarketDataJobRepository.layer,
            InstrumentRepository.layer,
            ExchangeRatesService.layer
        ])
    );
}
