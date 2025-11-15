 
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { settingsRepository } from '../../@settings/repository/settings.repository';
import { exchangeRatesFetchApi } from '../api/exchange-rates-fetch-api';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';
import { RATE_PRECISION_MULTIPLIER } from '../constant/rate-precision-multiplier.constant';
import { exchangeRateRepository } from '../repository/exchange-rate.repository';
import { instrumentRepository } from '../repository/instrument.repository';

class ExchangeRatesService {
    async sync(): Promise<void> {
        try {
            const apiData = await exchangeRatesFetchApi();

            if (!isDefined(apiData)) {
                return;
            }

            const baseInstrumentId = await this.getBaseCurrencyInstrumentId();

            if (!isDefined(baseInstrumentId) || !isPositiveNumber(baseInstrumentId)) {
                return;
            }

            // Get the base instrument to determine its code
            const baseInstrument = await instrumentRepository.findById(baseInstrumentId);
            const baseCurrencyCode = baseInstrument?.code ?? 'USD';

            await this.processInstrumentUpdates(baseInstrumentId, baseCurrencyCode, apiData.rates);
        } catch {
            // Ignore errors
        }
    }

    async registerBackgroundTask(): Promise<void> {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK);

            if (isRegistered) {
                return;
            }

            await BackgroundFetch.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
                minimumInterval: ONE_HOUR_IN_SECONDS,
                stopOnTerminate: false,
                startOnBoot: true
            });
        } catch {
            // Ignore errors
        }
    }

    private async getBaseCurrencyInstrumentId(): Promise<number | null> {
        const defaultInstrumentId = await settingsRepository.getDefaultInstrumentId();

        if (isDefined(defaultInstrumentId)) {
            return defaultInstrumentId;
        }

        // Fallback to USD if no default instrument is set
        return await instrumentRepository.getIdByCode('USD');
    }

    private async updateInstrumentRate(
        baseInstrumentId: number,
        instrument: { id: number; code: string },
        rates: Record<string, number>
    ): Promise<void> {
        const rate = rates[instrument.code];

        if (!isDefined(rate) || !isPositiveNumber(rate)) {
            return;
        }

        const rateInteger = Math.round(rate * RATE_PRECISION_MULTIPLIER);

        try {
            await exchangeRateRepository.upsert(baseInstrumentId, instrument.id, rateInteger, 'exchangerate-api.com');
        } catch {
            // Ignore errors for individual instruments
        }
    }

    private async processInstrumentUpdates(baseInstrumentId: number, baseCurrencyCode: string, rates: Record<string, number>): Promise<void> {
        const instruments = await instrumentRepository.getAll();

        if (!isNotEmptyArray(instruments)) {
            return;
        }

        const updates = instruments
            .filter((instrument) => instrument.code !== baseCurrencyCode)
            .map(async (instrument) => this.updateInstrumentRate(baseInstrumentId, instrument, rates));

        await Promise.all(updates);
    }
}

export const exchangeRatesService = new ExchangeRatesService();
