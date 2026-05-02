import { CurrencyEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const normalizeVoiceCurrency = (currency: string | undefined): CurrencyEnum | null => {
    if (!isNotEmptyString(currency)) {
        return null;
    }

    const normalized = currency.toLowerCase();

    if (normalized === 'грн' || normalized === 'гривень' || normalized === 'гривня' || normalized === 'uah' || normalized === '₴') {
        return CurrencyEnum.UAH;
    }

    if (normalized === 'usd' || normalized === '$') {
        return CurrencyEnum.USD;
    }

    if (normalized === 'eur' || normalized === '€') {
        return CurrencyEnum.EUR;
    }

    return null;
};
