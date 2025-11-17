/* eslint-disable lingui/no-unlocalized-strings */

import { LocaleInfoInterface } from '../interface/locale-info.interface';

export const DEFAULT_LOCALE = {
    measurementSystem: 'us',
    languageCurrencyCode: 'USD',
    textDirection: 'ltr',
    languageScriptCode: 'Latn',
    languageCode: 'en',
    temperatureUnit: 'fahrenheit',
    currencySymbol: '$',
    decimalSeparator: '.',
    digitGroupingSeparator: ',',
    languageRegionCode: 'US',
    currencyCode: 'USD',
    languageTag: 'en-US',
    regionCode: 'US',
    languageCurrencySymbol: '$'
} satisfies LocaleInfoInterface;
