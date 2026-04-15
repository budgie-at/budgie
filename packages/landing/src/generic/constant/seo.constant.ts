import linguiConfig from '../../../lingui.config.mjs';

export const BASE_URL = 'https://budgie.at';

export const LOCALES = linguiConfig.locales;

export const OG_LOCALE_MAP: Record<string, string> = {
    en: 'en_US',
    uk: 'uk_UA',
    fr: 'fr_FR',
    de: 'de_DE',
    es: 'es_ES'
};
