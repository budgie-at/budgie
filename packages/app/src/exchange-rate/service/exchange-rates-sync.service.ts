import { convertToMicroUnits } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';
import { ExchangeRateApiResponseInterface, emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';

import type { InstrumentEntityInterface } from '@budgie/contracts';

class ExchangeRatesService {
    async sync(): Promise<void> {
        const baseInstrument = await this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        const apiData = await this.fetch(baseInstrument.code);

        if (!isDefined(baseInstrument)) {
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

    private async fetch(code: string): Promise<ExchangeRateApiResponseInterface> {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${code}`);

        if (!response.ok) {
            return emptyExchangeRateApiResponse;
        }

        return (await response.json().catch(() => emptyExchangeRateApiResponse)) as ExchangeRateApiResponseInterface;
    }

    private async getBaseInstrument(): Promise<InstrumentEntityInterface | undefined> {
        const settings = await settingsRepository.getSettings();

        if (isPositiveNumber(settings.defaultInstrumentId)) {
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

        await exchangeRateRepository.upsert(baseInstrumentId, instrument.id, convertToMicroUnits(rate), 'exchangerate-api.com');

        const reverse = 1 / rate;

        await exchangeRateRepository.upsert(instrument.id, baseInstrumentId, convertToMicroUnits(reverse), 'exchangerate-api.com');
    }
}

export const exchangeRatesService = new ExchangeRatesService();
