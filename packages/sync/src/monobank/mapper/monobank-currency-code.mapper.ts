/* eslint-disable @typescript-eslint/no-magic-numbers */
const numericToCurrencyCode = new Map<number, string>([
    [980, 'UAH'],
    [840, 'USD'],
    [978, 'EUR'],
    [826, 'GBP'],
    [985, 'PLN'],
    [203, 'CZK'],
    [756, 'CHF'],
    [392, 'JPY'],
    [156, 'CNY'],
    [124, 'CAD'],
    [36, 'AUD'],
    [949, 'TRY'],
    [643, 'RUB'],
    [376, 'ILS'],
    [348, 'HUF'],
    [208, 'DKK'],
    [578, 'NOK'],
    [752, 'SEK']
]);

export const monobankCurrencyCodeMapper = (numericCode: number): string => numericToCurrencyCode.get(numericCode) ?? 'XXX';
