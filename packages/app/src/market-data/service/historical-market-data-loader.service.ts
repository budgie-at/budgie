import { AccountTypeEnum, Db, InstrumentPriceProviderEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    historicalExchangeRateRepository,
    instrumentDailyMarketPriceRepository,
    instrumentMarketDataJobRepository,
    instrumentRepository
} from '../../@generic/drizzle/db/db';
import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { coinGeckoMarketChartFetchApi } from '../api/coin-gecko-market-chart-fetch.api';

import type {
    AccountEntityInterface,
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

class HistoricalMarketDataLoaderService {
    private static readonly DATA_WINDOW_DAYS = 365;
    private static readonly DRAIN_DELAY_MS = 500;
    private static readonly DRAIN_KEY = 'historical-market-data';
    private static readonly MAX_ATTEMPTS = 3;
    private static readonly SOURCE = 'coingecko.com';
    private static readonly RATE_DATE_FORMAT = 'yyyy-MM-dd';
    private static readonly STALE_LOCK_MS = 5 * 60 * 1000;

    readonly enqueueAccounts = Effect.fn('HistoricalMarketDataLoaderService.enqueueAccounts')(function* (
        this: HistoricalMarketDataLoaderService,
        accounts: AccountEntityInterface[]
    ) {
        const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        const instruments = yield* instrumentRepository.findAll();
        const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
        const inputs = yield* Effect.forEach(
            this.getCandidateInstrumentIds(accounts, instrumentById),
            instrumentId => this.buildAccountJobInput(instrumentId, baseInstrument.id),
            { concurrency: 'unbounded' }
        );

        yield* instrumentMarketDataJobRepository.enqueueMany(inputs.filter(isDefined));
        yield* this.scheduleDrain();
    });

    readonly enqueueActiveAccounts = Effect.fn('HistoricalMarketDataLoaderService.enqueueActiveAccounts')(
        function* (this: HistoricalMarketDataLoaderService) {
            const accounts = yield* accountRepository.getAllActiveAccounts();

            yield* this.enqueueAccounts(accounts);
        }
    );

    readonly cancelScheduledDrain = Effect.fn('HistoricalMarketDataLoaderService.cancelScheduledDrain')(function* () {
        yield* Workload.use(workload => workload.cancelScheduled(HistoricalMarketDataLoaderService.DRAIN_KEY));
    });

    readonly scheduleDrain = Effect.fn('HistoricalMarketDataLoaderService.scheduleDrain')(
        function* (this: HistoricalMarketDataLoaderService) {
            const workload = yield* Workload;

            yield* workload.schedule(
                HistoricalMarketDataLoaderService.DRAIN_KEY,
                Effect.sleep(HistoricalMarketDataLoaderService.DRAIN_DELAY_MS).pipe(
                    Effect.andThen(waitForIdle),
                    Effect.andThen(this.drainNextJob()),
                    Effect.repeat({ while: shouldContinue => shouldContinue }),
                    Effect.catch(Effect.logError)
                )
            );
        }
    );

    private readonly drainNextJob = Effect.fn('HistoricalMarketDataLoaderService.drainNextJob')(
        function* (this: HistoricalMarketDataLoaderService) {
            const staleLockedBefore = new Date(Date.now() - HistoricalMarketDataLoaderService.STALE_LOCK_MS);
            const workload = yield* Workload;
            const job = yield* workload.run(
                instrumentMarketDataJobRepository.claimNext(HistoricalMarketDataLoaderService.MAX_ATTEMPTS, staleLockedBefore)
            );

            if (!isDefined(job)) {
                return false;
            }

            yield* this.processJob(job).pipe(
                Effect.catchCause(cause =>
                    workload.run(instrumentMarketDataJobRepository.markFailed(job.id, getErrorMessage(Cause.squash(cause))))
                )
            );

            return true;
        }
    );

    private readonly processJob = Effect.fn('HistoricalMarketDataLoaderService.processJob')(function* (
        this: HistoricalMarketDataLoaderService,
        job: InstrumentMarketDataJobEntityInterface
    ) {
        const instrument = yield* instrumentRepository.findByIdAsync(job.instrumentId);

        if (!isDefined(instrument)) {
            return yield* Effect.die(new Error(t`Instrument not found`));
        }

        const prices = yield* this.fetchHistoricalPrices(instrument, job);

        return yield* Workload.use(workload =>
            workload.run(
                Db.transaction(
                    Effect.all(
                        [
                            instrumentDailyMarketPriceRepository.bulkUpsert(prices),
                            historicalExchangeRateRepository.bulkUpsert(this.buildHistoricalRateInputs(prices)),
                            instrumentMarketDataJobRepository.markCompleted(job.id)
                        ],
                        { discard: true }
                    )
                )
            )
        );
    });

    private readonly buildAccountJobInput = Effect.fn('HistoricalMarketDataLoaderService.buildAccountJobInput')(function* (
        this: HistoricalMarketDataLoaderService,
        instrumentId: number,
        quoteInstrumentId: number
    ) {
        const toDate = format(new Date(), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);
        const hasOpenJob = yield* instrumentMarketDataJobRepository.hasOpen(instrumentId, quoteInstrumentId);

        if (hasOpenJob) {
            return null;
        }

        const fromDate = yield* this.getNextMissingFromDate(instrumentId, quoteInstrumentId);

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

    private readonly getNextMissingFromDate = Effect.fn('HistoricalMarketDataLoaderService.getNextMissingFromDate')(function* (
        instrumentId: number,
        quoteInstrumentId: number
    ) {
        const latestPrice = yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId);

        if (isDefined(latestPrice)) {
            return format(addDays(parseISO(latestPrice.priceDate), 1), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);
        }

        return format(
            subDays(new Date(), HistoricalMarketDataLoaderService.DATA_WINDOW_DAYS - 1),
            HistoricalMarketDataLoaderService.RATE_DATE_FORMAT
        );
    });

    private readonly fetchHistoricalPrices = Effect.fn('HistoricalMarketDataLoaderService.fetchHistoricalPrices')(function* (
        this: HistoricalMarketDataLoaderService,
        instrument: InstrumentEntityInterface,
        job: InstrumentMarketDataJobEntityInterface
    ) {
        if (!isDefined(instrument.providerInstrumentId)) {
            return [];
        }

        const quoteCode = (yield* instrumentRepository.findByIdAsync(job.quoteInstrumentId))?.code.toLowerCase() ?? 'usd';
        const fromDate = this.getSupportedFromDate(job.fromDate);

        if (isAfter(parseISO(fromDate), parseISO(job.toDate))) {
            return [];
        }

        const data = yield* coinGeckoMarketChartFetchApi(instrument.providerInstrumentId, quoteCode, fromDate, job.toDate);

        if (!isNotEmptyArray(data.prices)) {
            return yield* Effect.die(new Error(t`Market data prices missing`));
        }

        const marketCapByDate = this.buildTimedValueMap(data.market_caps);
        const volumeByDate = this.buildTimedValueMap(data.total_volumes);

        return data.prices.flatMap(([timestamp, price]): InstrumentDailyMarketPriceCreateEntityInterface[] => {
            const priceDate = format(new Date(timestamp), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);

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
                    source: HistoricalMarketDataLoaderService.SOURCE
                }
            ];
        });
    });

    private getCandidateInstrumentIds(
        accounts: AccountEntityInterface[],
        instrumentById: Map<number, InstrumentEntityInterface>
    ): number[] {
        const uniqueInstrumentIds = new Set<number>();

        for (const account of accounts) {
            const isCandidate = account.type === AccountTypeEnum.CRYPTO && !uniqueInstrumentIds.has(account.instrumentId);

            if (isCandidate && this.isSupportedInstrument(instrumentById.get(account.instrumentId))) {
                uniqueInstrumentIds.add(account.instrumentId);
            }
        }

        return [...uniqueInstrumentIds];
    }

    private getSupportedFromDate(fromDate: string): string {
        const earliestDate = subDays(new Date(), HistoricalMarketDataLoaderService.DATA_WINDOW_DAYS - 1);
        const requestedDate = parseISO(fromDate);
        const supportedDate = isAfter(requestedDate, earliestDate) ? requestedDate : earliestDate;

        return format(supportedDate, HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);
    }

    private buildHistoricalRateInputs(
        prices: InstrumentDailyMarketPriceCreateEntityInterface[]
    ): HistoricalExchangeRateCreateEntityInterface[] {
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
    }

    private buildTimedValueMap(values: ReadonlyArray<readonly [number, number]>): Map<string, number> {
        return new Map(
            values.map(([timestamp, value]) => [format(new Date(timestamp), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT), value])
        );
    }

    private isSupportedInstrument(instrument: InstrumentEntityInterface | undefined): boolean {
        return (
            isDefined(instrument) &&
            instrument.type === InstrumentTypeEnum.CRYPTO &&
            instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO &&
            isDefined(instrument.providerInstrumentId)
        );
    }
}

export const historicalMarketDataLoaderService = new HistoricalMarketDataLoaderService();
