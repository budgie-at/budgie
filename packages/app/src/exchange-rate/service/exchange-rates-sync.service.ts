import { InstrumentPriceProviderEnum, InstrumentTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, exchangeRateRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ExchangeRateApiResponseInterface, emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';
import { CoinGeckoSimplePriceResponseSchema } from '../schema/coin-gecko-simple-price-response.schema';
import { ExchangeRateApiResponseSchema } from '../schema/exchange-rate-api-response.schema';

import { exchangeRatesService } from './exchange-rates.service';

import type { ExchangeRateCreateEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

class ExchangeRatesSyncService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly COINGECKO_SIMPLE_PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
    private static readonly EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';
    private static readonly CRYPTO_RATE_SYNC_BATCH_SIZE = 40;
    private static readonly FETCH_TIMEOUT_MS = 5000;
    private static readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000;

    private isSyncing = false;
    private lastSyncedAtMs: number | null = null;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
            minimumInterval: ExchangeRatesSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<void> {
        if (this.isSyncing) {
            return;
        }

        this.isSyncing = true;

        try {
            await this.syncInner();
        } finally {
            this.isSyncing = false;
        }
    }

    private async syncInner(): Promise<void> {
        const now = Date.now();

        if (isDefined(this.lastSyncedAtMs) && now - this.lastSyncedAtMs < ExchangeRatesSyncService.SYNC_COOLDOWN_MS) {
            return;
        }

        const baseInstrument = await exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        await this.syncFiatRates(baseInstrument);
        await microPause();
        await this.syncCryptoRates(baseInstrument);
        this.lastSyncedAtMs = Date.now();
    }

    private async syncFiatRates(baseInstrument: InstrumentEntityInterface): Promise<void> {
        const apiData = await this.fetch(baseInstrument.code);
        const instruments = await instrumentRepository.findByType(InstrumentTypeEnum.FIAT);
        const inputs = instruments.flatMap(instrument =>
            instrument.code === baseInstrument.code
                ? []
                : this.buildInstrumentRateInputs(baseInstrument.id, instrument, apiData.rates, 'exchangerate-api.com')
        );

        await transactionAsync(db, tx => exchangeRateRepository.bulkUpsert(inputs, tx));
    }

    private async syncCryptoRates(baseInstrument: InstrumentEntityInterface): Promise<void> {
        const instruments = await instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
            InstrumentTypeEnum.CRYPTO,
            InstrumentPriceProviderEnum.COINGECKO
        );

        if (!isNotEmptyArray(instruments)) {
            return;
        }

        await processInputWithBatches(instruments, ExchangeRatesSyncService.CRYPTO_RATE_SYNC_BATCH_SIZE, async batch => {
            await this.syncCryptoRateBatch(baseInstrument, batch);

            return null;
        });
    }

    private async syncCryptoRateBatch(baseInstrument: InstrumentEntityInterface, instruments: InstrumentEntityInterface[]): Promise<void> {
        const providerInstrumentIds = [...new Set(instruments.map(instrument => instrument.providerInstrumentId).filter(isDefined))];

        if (!isNotEmptyArray(providerInstrumentIds)) {
            return;
        }

        const prices = await this.fetchCryptoPrices(providerInstrumentIds, baseInstrument.code);
        const quoteCode = baseInstrument.code.toLowerCase();
        const inputs = instruments.flatMap(instrument =>
            this.buildCryptoInstrumentRateInputs(
                baseInstrument.id,
                instrument,
                this.getCryptoPrice(prices, instrument.providerInstrumentId, quoteCode)
            )
        );

        if (!isNotEmptyArray(inputs)) {
            return;
        }

        await transactionAsync(db, tx => exchangeRateRepository.bulkUpsert(inputs, tx));
    }

    private async fetch(code: string): Promise<ExchangeRateApiResponseInterface> {
        const response = await this.fetchWithTimeout(`${ExchangeRatesSyncService.EXCHANGE_RATE_API_URL}/${code}`);

        if (!isDefined(response) || !response.ok) {
            return emptyExchangeRateApiResponse;
        }

        const payload: unknown = await response.json().catch(() => null);
        const result = ExchangeRateApiResponseSchema.safeParse(payload);

        if (!result.success) {
            return emptyExchangeRateApiResponse;
        }

        return result.data;
    }

    private async fetchCryptoPrices(
        providerInstrumentIds: string[],
        quoteCode: string
    ): Promise<Partial<Record<string, Partial<Record<string, number>>>>> {
        const ids = providerInstrumentIds.map(encodeURIComponent).join(',');
        const quote = encodeURIComponent(quoteCode.toLowerCase());
        const response = await this.fetchWithTimeout(
            `${ExchangeRatesSyncService.COINGECKO_SIMPLE_PRICE_API_URL}?ids=${ids}&vs_currencies=${quote}`
        );

        if (!isDefined(response) || !response.ok) {
            return {};
        }

        const payload: unknown = await response.json().catch(() => null);
        const result = CoinGeckoSimplePriceResponseSchema.safeParse(payload);

        if (!result.success) {
            return {};
        }

        return result.data;
    }

    private async fetchWithTimeout(url: string): Promise<Response | null> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => void controller.abort(), ExchangeRatesSyncService.FETCH_TIMEOUT_MS);

        try {
            return await fetch(url, { signal: controller.signal }).catch(() => null);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private getCryptoPrice(
        prices: Partial<Record<string, Partial<Record<string, number>>>>,
        providerInstrumentId: string | null,
        quoteCode: string
    ): number | null {
        if (!isDefined(providerInstrumentId)) {
            return null;
        }

        return prices[providerInstrumentId]?.[quoteCode] ?? null;
    }

    private buildInstrumentRateInputs(
        baseInstrumentId: number,
        instrument: { id: number; code: string },
        rates: Record<string, number>,
        source: string
    ): ExchangeRateCreateEntityInterface[] {
        const rate = rates[instrument.code];

        if (!isPositiveNumber(rate)) {
            return [];
        }

        return this.buildRatePairInputs(baseInstrumentId, instrument.id, rate, source);
    }

    private buildCryptoInstrumentRateInputs(
        baseInstrumentId: number,
        instrument: InstrumentEntityInterface,
        rate: number | null
    ): ExchangeRateCreateEntityInterface[] {
        if (!isPositiveNumber(rate)) {
            return [];
        }

        return this.buildRatePairInputs(instrument.id, baseInstrumentId, rate, 'coingecko.com');
    }

    private buildRatePairInputs(
        baseInstrumentId: number,
        quoteInstrumentId: number,
        rate: number,
        source: string
    ): ExchangeRateCreateEntityInterface[] {
        return [
            {
                baseInstrumentId,
                quoteInstrumentId,
                rate,
                source
            },
            {
                baseInstrumentId: quoteInstrumentId,
                quoteInstrumentId: baseInstrumentId,
                rate: 1 / rate,
                source
            }
        ];
    }
}

export const exchangeRatesSyncService = new ExchangeRatesSyncService();
