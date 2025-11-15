import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../drizzle/db/db';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';
import { ExchangeRateApiResponseInterface, emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';

import type { InstrumentEntityInterface } from '@budgie/contracts';

class ExchangeRatesService {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private RATE_PRECISION_MULTIPLIER = 1_000_000;
    private EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

    async sync(): Promise<void> {
        const [apiData, baseInstrument] = await Promise.all([this.fetch(), this.getBaseInstrument()]);

        if (!isPositiveNumber(baseInstrument)) {
            return;
        }

        for (const instrument of await instrumentRepository.getAll()) {
            if (instrument.code !== baseInstrument.code) {
                // eslint-disable-next-line no-await-in-loop
                await this.updateInstrumentRate(baseInstrument.id, instrument, apiData.rates);
            }
        }
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
            minimumInterval: ONE_HOUR_IN_SECONDS
        });
    }

    private async fetch(): Promise<ExchangeRateApiResponseInterface> {
        const response = await fetch(this.EXCHANGE_RATE_API_URL);

        if (!response.ok) {
            return emptyExchangeRateApiResponse;
        }

        return (await response.json().catch(() => emptyExchangeRateApiResponse)) as ExchangeRateApiResponseInterface;
    }

    private async getBaseInstrument(): Promise<InstrumentEntityInterface | undefined> {
        const settings = await settingsRepository.getSettings();

        if (isDefined(settings.defaultInstrumentId)) {
            return await instrumentRepository.findById(settings.defaultInstrumentId);
        }

        return await instrumentRepository.findByCode('USD');
    }

    private async updateInstrumentRate(
        baseInstrumentId: number,
        instrument: { id: number; code: string },
        rates: Record<string, number>
    ): Promise<void> {
        const rate = rates[instrument.code];
        if (!isPositiveNumber(rate)) {
            return;
        }

        const rateInteger = Math.round(rate * this.RATE_PRECISION_MULTIPLIER);

        await exchangeRateRepository.upsert(baseInstrumentId, instrument.id, rateInteger, 'exchangerate-api.com');
    }
}

export const exchangeRatesService = new ExchangeRatesService();
