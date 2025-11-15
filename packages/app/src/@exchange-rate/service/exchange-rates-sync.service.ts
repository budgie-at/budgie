import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { settingsRepository } from '../../@settings/repository/settings.repository';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';
import { exchangeRateRepository } from '../repository/exchange-rate.repository';
import { instrumentRepository } from '../repository/instrument.repository';

import type { ExchangeRateApiResponseInterface } from '../interface/exchange-rate-api-response.interface';
import type { InstrumentEntityInterface } from '@budgie/contracts';

class ExchangeRatesService {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private RATE_PRECISION_MULTIPLIER = 1_000_000;
    private EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

    async sync(): Promise<void> {
        const apiData = await this.fetch();
        if (!isDefined(apiData)) {
            return;
        }

        const baseInstrument = await this.getBaseInstrument();
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

        await BackgroundFetch.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
            minimumInterval: ONE_HOUR_IN_SECONDS,
            stopOnTerminate: false,
            startOnBoot: true
        });
    }

    private async fetch(): Promise<ExchangeRateApiResponseInterface | null> {
        try {
            const response = await fetch(this.EXCHANGE_RATE_API_URL);

            if (!response.ok) {
                return null;
            }

            return (await response.json()) as ExchangeRateApiResponseInterface;
        } catch {
            return null;
        }
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
