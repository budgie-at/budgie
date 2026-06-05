import { InstrumentPriceProviderEnum, InstrumentTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, exchangeRateRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ExchangeRateApiResponseInterface, emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';
import { CoinGeckoSimplePriceResponseSchema } from '../schema/coin-gecko-simple-price-response.schema';
import { ExchangeRateApiResponseSchema } from '../schema/exchange-rate-api-response.schema';

import { exchangeRatesService } from './exchange-rates.service';

import type { ExchangeRateCreateEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

class ExchangeRatesSyncService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000;

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

    async sync(): Promise<void> {
        const now = Date.now();

        if (isDefined(this.lastSyncedAtMs) && now - this.lastSyncedAtMs < ExchangeRatesSyncService.SYNC_COOLDOWN_MS) {
            return;
        }

        const baseInstrument = await exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        await Promise.all([this.syncFiatRates(baseInstrument), this.syncCryptoRates(baseInstrument)]);
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
        const instruments = await instrumentRepository.findByType(InstrumentTypeEnum.CRYPTO);
        const coingeckoInstruments = instruments.filter(
            instrument => instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO && isDefined(instrument.providerInstrumentId)
        );
        const providerInstrumentIds = coingeckoInstruments.map(instrument => instrument.providerInstrumentId).filter(isDefined);

        if (!isNotEmptyArray(providerInstrumentIds)) {
            return;
        }

        const prices = await this.fetchCryptoPrices(providerInstrumentIds, baseInstrument.code);
        const quoteCode = baseInstrument.code.toLowerCase();
        const inputs = coingeckoInstruments.flatMap(instrument =>
            this.buildCryptoInstrumentRateInputs(
                baseInstrument.id,
                instrument,
                this.getCryptoPrice(prices, instrument.providerInstrumentId, quoteCode)
            )
        );

        await transactionAsync(db, tx => exchangeRateRepository.bulkUpsert(inputs, tx));
    }

    private async fetch(code: string): Promise<ExchangeRateApiResponseInterface> {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${code}`).catch(() => null);

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
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${quote}`).catch(() => null);

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
