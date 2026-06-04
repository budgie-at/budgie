import { InstrumentEntityInterface } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';

class ExchangeRatesService {
    async convert(
        fromInstrumentId: number,
        toInstrumentId: number,
        fromAmountInMicroUnits: number
    ): Promise<{ amount: number; exchangeRate: number }> {
        if (fromInstrumentId === toInstrumentId) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        const exchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId);

        if (isDefined(exchangeRate)) {
            return { amount: fromAmountInMicroUnits / exchangeRate.rate, exchangeRate: exchangeRate.rate };
        }

        const baseInstrument = await this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        const [baseFromExchangeRate, baseToExchangeRate] = await Promise.all([
            exchangeRateRepository.findByBaseAndQuoteIds(baseInstrument.id, fromInstrumentId),
            exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, baseInstrument.id)
        ]);

        if (!isDefined(baseFromExchangeRate) || !isDefined(baseToExchangeRate)) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        return {
            amount: fromAmountInMicroUnits / baseFromExchangeRate.rate / baseToExchangeRate.rate,
            exchangeRate: baseToExchangeRate.rate
        };
    }

    async convertStrict(
        fromInstrumentId: number,
        toInstrumentId: number,
        fromAmountInMicroUnits: number
    ): Promise<{ amount: number; exchangeRate: number } | null> {
        const exchangeRate = await this.findCurrentConversionRate(fromInstrumentId, toInstrumentId);

        if (!isDefined(exchangeRate)) {
            return null;
        }

        return {
            amount: Math.round(fromAmountInMicroUnits * exchangeRate),
            exchangeRate
        };
    }

    async getBaseInstrument(): Promise<InstrumentEntityInterface | undefined> {
        const settings = await settingsRepository.getSettings();

        if (isPositiveNumber(settings.defaultInstrumentId)) {
            return await instrumentRepository.findById(settings.defaultInstrumentId);
        }

        return await instrumentRepository.findByCode('USD');
    }

    private async findCurrentConversionRate(fromInstrumentId: number, toInstrumentId: number): Promise<number | null> {
        if (fromInstrumentId === toInstrumentId) {
            return 1;
        }

        const directExchangeRate = await this.findDirectOrInverseConversionRate(fromInstrumentId, toInstrumentId);

        if (isDefined(directExchangeRate)) {
            return directExchangeRate;
        }

        const baseInstrument = await this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return null;
        }

        const [fromToBaseExchangeRate, baseToTargetExchangeRate] = await Promise.all([
            this.findDirectOrInverseConversionRate(fromInstrumentId, baseInstrument.id),
            this.findDirectOrInverseConversionRate(baseInstrument.id, toInstrumentId)
        ]);

        if (!isDefined(fromToBaseExchangeRate) || !isDefined(baseToTargetExchangeRate)) {
            return null;
        }

        return fromToBaseExchangeRate * baseToTargetExchangeRate;
    }

    private async findDirectOrInverseConversionRate(fromInstrumentId: number, toInstrumentId: number): Promise<number | null> {
        const directExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(fromInstrumentId, toInstrumentId);

        if (isDefined(directExchangeRate)) {
            return directExchangeRate.rate;
        }

        const inverseExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId);

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        return null;
    }
}

export const exchangeRatesService = new ExchangeRatesService();
