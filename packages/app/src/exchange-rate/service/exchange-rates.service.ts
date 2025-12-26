import { InstrumentEntityInterface } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class ExchangeRatesService {
    async convert(fromInstrumentId: number, toInstrumentId: number, fromAmountInMicroUnits: number): Promise<{amount: number; exchangeRate: number}> {
        const exchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId);

        if (isDefined(exchangeRate)) {
            return {
                amount: convertToMicroUnits(fromAmountInMicroUnits / exchangeRate.rate),
                exchangeRate: exchangeRate.rate
            };
        }

        const baseInstrument = await this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return {
                amount: fromAmountInMicroUnits,
                exchangeRate: convertToMicroUnits(1)
            };
        }

        const [baseFromExchangeRate, baseToExchangeRate] = await Promise.all([
            exchangeRateRepository.findByBaseAndQuoteIds(baseInstrument.id, fromInstrumentId),
            exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, baseInstrument.id)
        ]);

        if (!isDefined(baseFromExchangeRate) || !isDefined(baseToExchangeRate)) {
            return {
                amount: fromAmountInMicroUnits,
                exchangeRate: convertToMicroUnits(1)
            };
        }

        const toAmountInMicroUnits = convertToMicroUnits(fromAmountInMicroUnits / baseFromExchangeRate.rate);

        return {
            amount: convertToMicroUnits(toAmountInMicroUnits / baseToExchangeRate.rate),
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
