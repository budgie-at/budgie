import { CurrencyEnum } from '@budgie/contracts';

export const DEFAULT_CURRENCY = {
    code: CurrencyEnum.USD,
    name: 'US Dollar',
    emoji: '🇺🇸',
    symbol: '$'
};

export const CURRENCIES = [
    {
        code: CurrencyEnum.USD,
        name: 'US Dollar',
        emoji: '🇺🇸',
        symbol: '$'
    },
    {
        code: CurrencyEnum.EUR,
        name: 'Euro',
        emoji: '🇪🇺',
        symbol: '€'
    }
];
