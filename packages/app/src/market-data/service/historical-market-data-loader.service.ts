import { AccountTypeEnum, InstrumentPriceProviderEnum, InstrumentTypeEnum, transactionAsync } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { addDays, format, isAfter, parseISO, subDays } from 'date-fns';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    db,
    historicalExchangeRateRepository,
    instrumentDailyMarketPriceRepository,
    instrumentMarketDataJobRepository,
    instrumentRepository
} from '../../@generic/drizzle/db/db';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { coinGeckoMarketChartFetchApi } from '../api/coin-gecko-market-chart-fetch.api';

import type {
    AccountEntityInterface,
    DB,
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobCreateEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

class HistoricalMarketDataLoaderService {
    private static readonly DATA_WINDOW_DAYS = 365;
    private static readonly DRAIN_DELAY_MS = 500;
    private static readonly MAX_ATTEMPTS = 3;
    private static readonly SOURCE = 'coingecko.com';
    private static readonly RATE_DATE_FORMAT = 'yyyy-MM-dd';
    private static readonly STALE_LOCK_MS = 5 * 60 * 1000;

    private cancelIdleCallback: (() => void) | null = null;
    private isRunning = false;
    private timer: ReturnType<typeof setTimeout> | null = null;

    async enqueueAccounts(accounts: AccountEntityInterface[], tx?: DB): Promise<void> {
        const baseInstrument = await exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        const instruments = await instrumentRepository.findAll();
        const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
        const inputs = await this.buildAccountJobInputs(accounts, instrumentById, baseInstrument, tx);

        await instrumentMarketDataJobRepository.enqueueMany(inputs, tx);
        this.scheduleDrain();
    }

    async enqueueActiveAccounts(): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts();

        await this.enqueueAccounts(accounts);
    }

    scheduleDrain(): void {
        if (this.isRunning || isDefined(this.timer)) {
            return;
        }

        this.timer = setTimeout(() => {
            this.timer = null;
            this.cancelIdleCallback = scheduleIdleCallback(() => {
                this.cancelIdleCallback = null;
                this.drain().catch(emptyFn);
            });
        }, HistoricalMarketDataLoaderService.DRAIN_DELAY_MS);
    }

    private async drain(): Promise<void> {
        this.cancelScheduledDrain();

        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        const shouldContinue = await this.drainNextJob().finally(() => {
            this.isRunning = false;
        });

        if (shouldContinue) {
            this.scheduleDrain();
        }
    }

    private async drainNextJob(): Promise<boolean> {
        const staleLockedBefore = new Date(Date.now() - HistoricalMarketDataLoaderService.STALE_LOCK_MS);
        const job = await instrumentMarketDataJobRepository.findNext(HistoricalMarketDataLoaderService.MAX_ATTEMPTS, staleLockedBefore);

        if (!isDefined(job)) {
            return false;
        }

        await this.processJob(job).catch(async (error: unknown) => {
            await instrumentMarketDataJobRepository.markFailed(job.id, getErrorMessage(error));
        });

        return true;
    }

    private async processJob(job: InstrumentMarketDataJobEntityInterface): Promise<void> {
        await instrumentMarketDataJobRepository.markRunning(job.id);

        const instrument = await instrumentRepository.findByIdAsync(job.instrumentId);

        if (!isDefined(instrument)) {
            throw new Error(t`Instrument not found`);
        }

        const prices = await this.fetchHistoricalPrices(instrument, job);

        await transactionAsync(db, async tx => {
            await instrumentDailyMarketPriceRepository.bulkUpsert(prices, tx);
            await historicalExchangeRateRepository.bulkUpsert(this.buildHistoricalRateInputs(prices), tx);
            await instrumentMarketDataJobRepository.markCompleted(job.id, tx);
        });
    }

    private async buildAccountJobInputs(
        accounts: AccountEntityInterface[],
        instrumentById: Map<number, InstrumentEntityInterface>,
        baseInstrument: InstrumentEntityInterface,
        tx?: DB
    ): Promise<InstrumentMarketDataJobCreateEntityInterface[]> {
        const uniqueInstrumentIds = new Set<number>();
        const candidateInstrumentIds: number[] = [];

        for (const account of accounts) {
            const isCandidate = account.type === AccountTypeEnum.CRYPTO && !uniqueInstrumentIds.has(account.instrumentId);

            if (isCandidate && this.isSupportedInstrument(instrumentById.get(account.instrumentId))) {
                uniqueInstrumentIds.add(account.instrumentId);
                candidateInstrumentIds.push(account.instrumentId);
            }
        }

        const inputs = await Promise.all(
            candidateInstrumentIds.map(instrumentId => this.buildAccountJobInput(instrumentId, baseInstrument.id, tx))
        );

        return inputs.filter(isDefined);
    }

    private async buildAccountJobInput(
        instrumentId: number,
        quoteInstrumentId: number,
        tx?: DB
    ): Promise<InstrumentMarketDataJobCreateEntityInterface | null> {
        const toDate = format(new Date(), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);
        const hasOpenJob = await instrumentMarketDataJobRepository.hasOpen(instrumentId, quoteInstrumentId, tx);

        if (hasOpenJob) {
            return null;
        }

        const fromDate = await this.getNextMissingFromDate(instrumentId, quoteInstrumentId, tx);

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
    }

    private async getNextMissingFromDate(instrumentId: number, quoteInstrumentId: number, tx?: DB): Promise<string> {
        const latestPrice = await instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId, tx);

        if (isDefined(latestPrice)) {
            return format(addDays(parseISO(latestPrice.priceDate), 1), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT);
        }

        return format(
            subDays(new Date(), HistoricalMarketDataLoaderService.DATA_WINDOW_DAYS - 1),
            HistoricalMarketDataLoaderService.RATE_DATE_FORMAT
        );
    }

    private async fetchHistoricalPrices(
        instrument: InstrumentEntityInterface,
        job: InstrumentMarketDataJobEntityInterface
    ): Promise<InstrumentDailyMarketPriceCreateEntityInterface[]> {
        if (!isDefined(instrument.providerInstrumentId)) {
            return [];
        }

        const quoteCode = await this.getQuoteCode(job.quoteInstrumentId);
        const fromDate = this.getSupportedFromDate(job.fromDate);

        if (isAfter(parseISO(fromDate), parseISO(job.toDate))) {
            return [];
        }

        const data = await coinGeckoMarketChartFetchApi(instrument.providerInstrumentId, quoteCode, fromDate, job.toDate);

        if (!isNotEmptyArray(data.prices)) {
            throw new Error(t`Market data prices missing`);
        }

        const marketCapByDate = this.buildTimedValueMap(data.market_caps);
        const volumeByDate = this.buildTimedValueMap(data.total_volumes);

        return data.prices.flatMap(([timestamp, price]) => {
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

    private buildTimedValueMap(values: [number, number][]): Map<string, number> {
        return new Map(
            values.map(([timestamp, value]) => [format(new Date(timestamp), HistoricalMarketDataLoaderService.RATE_DATE_FORMAT), value])
        );
    }

    private async getQuoteCode(quoteInstrumentId: number): Promise<string> {
        const quoteInstrument = await instrumentRepository.findByIdAsync(quoteInstrumentId);

        return quoteInstrument?.code.toLowerCase() ?? 'usd';
    }

    private isSupportedInstrument(instrument: InstrumentEntityInterface | undefined): boolean {
        return (
            isDefined(instrument) &&
            instrument.type === InstrumentTypeEnum.CRYPTO &&
            instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO &&
            isDefined(instrument.providerInstrumentId)
        );
    }

    private cancelScheduledDrain(): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.cancelIdleCallback?.();
        this.cancelIdleCallback = null;
    }
}

export const historicalMarketDataLoaderService = new HistoricalMarketDataLoaderService();
