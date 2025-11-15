 
import { fetchExchangeRatesFromApi } from '../api/fetch-exchange-rates-from-api';
import { BASE_CURRENCY_CODE } from '../constant/base-currency-code.constant';
import { RATE_PRECISION_MULTIPLIER } from '../constant/rate-precision-multiplier.constant';
import { getAllInstruments } from '../repository/get-all-instruments.repository';
import { getInstrumentIdByCode } from '../repository/get-instrument-id-by-code.repository';
import { upsertExchangeRate } from '../repository/upsert-exchange-rate.repository';

export const syncExchangeRates = async (): Promise<void> => {
    try {
        const apiData = await fetchExchangeRatesFromApi();

        if (!apiData) {
            return;
        }

        const baseInstrumentId = await getInstrumentIdByCode(BASE_CURRENCY_CODE);

        if (!baseInstrumentId) {
            return;
        }

        const instruments = await getAllInstruments();

        const updates = instruments
            .filter((instrument) => instrument.code !== BASE_CURRENCY_CODE)
            .map(async (instrument) => {
                const rate = apiData.rates[instrument.code];

                if (!rate) {
                    return;
                }

                const rateInteger = Math.round(rate * RATE_PRECISION_MULTIPLIER);

                try {
                    await upsertExchangeRate(baseInstrumentId, instrument.id, rateInteger, 'exchangerate-api.com');
                } catch {
                    // Ignore errors for individual instruments
                }
            });

        await Promise.all(updates);
    } catch {
        // Ignore errors
    }
};
