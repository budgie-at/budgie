import { CurrencyEnum } from '@budgie/contracts';

export const formatMoney = (amount: number, currency = CurrencyEnum.USD, locale = 'en-US'): string =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(amount);
