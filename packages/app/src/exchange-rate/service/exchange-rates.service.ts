import { InstrumentEntityInterface } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';

class ExchangeRatesService {
    async convert(fromInstrumentId: number, toInstrumentId: number, fromAmountInMicroUnits: number): Promise<{amount: number; exchangeRate: number}> {
        const exchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId);

        if (isDefined(exchangeRate)) {
            return {
                amount: fromAmountInMicroUnits / exchangeRate.rate,
                exchangeRate: exchangeRate.rate
            };
        }

        const baseInstrument = await this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return {
                amount: fromAmountInMicroUnits,
                exchangeRate: 1
            };
        }

        const [baseFromExchangeRate, baseToExchangeRate] = await Promise.all([
            exchangeRateRepository.findByBaseAndQuoteIds(baseInstrument.id, fromInstrumentId),
            exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, baseInstrument.id)
        ]);

        if (!isDefined(baseFromExchangeRate) || !isDefined(baseToExchangeRate)) {
            return {
                amount: fromAmountInMicroUnits,
                exchangeRate: 1
            };
        }

        const toAmount = fromAmountInMicroUnits / baseFromExchangeRate.rate;

        return {
            amount: toAmount / baseToExchangeRate.rate,
            exchangeRate: baseToExchangeRate.rate
        };
    }

    async getBaseInstrument(): Promise<InstrumentEntityInterface | undefined> {
        const settings = await settingsRepository.getSettings();

        if (isPositiveNumber(settings.defaultInstrumentId)) {
            return await instrumentRepository.findById(settings.defaultInstrumentId);
        }

        return await instrumentRepository.findByCode('USD');
    }
}

export const exchangeRatesService = new ExchangeRatesService();
