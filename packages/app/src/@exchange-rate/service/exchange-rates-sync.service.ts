 
import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRatesFetchApi } from '../api/exchange-rates-fetch-api';
import { RATE_PRECISION_MULTIPLIER } from '../constant/rate-precision-multiplier.constant';
import { exchangeRateRepository } from '../repository/exchange-rate.repository';
import { instrumentRepository } from '../repository/instrument.repository';

const getBaseCurrencyCode = (): string =>
    // TODO: Fetch from settings table when implemented
    'USD';

const updateInstrumentRate = async (
    baseInstrumentId: number,
    instrument: { id: number; code: string },
    rates: Record<string, number>
): Promise<void> => {
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
};

const processInstrumentUpdates = async (baseInstrumentId: number, baseCurrencyCode: string, rates: Record<string, number>): Promise<void> => {
    const instruments = await instrumentRepository.getAll();

    if (!isNotEmptyArray(instruments)) {
        return;
    }

    const updates = instruments
        .filter((instrument) => instrument.code !== baseCurrencyCode)
        .map(async (instrument) => updateInstrumentRate(baseInstrumentId, instrument, rates));

    await Promise.all(updates);
};

export const exchangeRatesSyncService = async (): Promise<void> => {
    try {
        const apiData = await exchangeRatesFetchApi();

        if (!isDefined(apiData)) {
            return;
        }

        const baseCurrencyCode = getBaseCurrencyCode();
        const baseInstrumentId = await instrumentRepository.getIdByCode(baseCurrencyCode);

        if (!isDefined(baseInstrumentId) || !isPositiveNumber(baseInstrumentId)) {
            return;
        }

        await processInstrumentUpdates(baseInstrumentId, baseCurrencyCode, apiData.rates);
    } catch {
        // Ignore errors
    }
};
