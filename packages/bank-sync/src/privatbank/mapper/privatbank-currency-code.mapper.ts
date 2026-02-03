/* eslint-disable @typescript-eslint/no-magic-numbers */
const currencyStringToNumericCode = new Map<string, number>([
    ['UAH', 980],
    ['EUR', 978],
    ['USD', 840],
    ['GBP', 826],
    ['PLN', 985],
    ['CZK', 203],
    ['CHF', 756],
    ['JPY', 392],
    ['CNY', 156],
    ['CAD', 124],
    ['AUD', 36],
    ['TRY', 949],
    ['ILS', 376],
    ['HUF', 348],
    ['DKK', 208],
    ['NOK', 578],
    ['SEK', 752]
]);

const DEFAULT_CURRENCY_CODE = 0;

export const privatbankCurrencyCodeMapper = (currencyString: string): number =>
    currencyStringToNumericCode.get(currencyString) ?? DEFAULT_CURRENCY_CODE;
