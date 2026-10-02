import { SUPPORTED_LOCALES } from '../../i18n/supported-locales.constant.mjs';

export const BASE_URL = 'https://budgie.at';
// oxlint-disable-next-line lingui/no-unlocalized-strings
export const TITLE_TEMPLATE_SUFFIX = ' | Budgie';

export const LOCALES = SUPPORTED_LOCALES;

export const OG_LOCALE_MAP: Record<string, string> = {
    en: 'en_US',
    uk: 'uk_UA',
    fr: 'fr_FR',
    de: 'de_DE',
    es: 'es_ES'
};
