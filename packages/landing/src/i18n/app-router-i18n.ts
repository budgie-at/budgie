import 'server-only';
import { I18n, Messages, setupI18n } from '@lingui/core';

import { messages as deClientMessages } from './locales/de/client-messages';
import { messages as deMessages } from './locales/de/messages';
import { messages as enClientMessages } from './locales/en/client-messages';
import { messages as enMessages } from './locales/en/messages';
import { messages as esClientMessages } from './locales/es/client-messages';
import { messages as esMessages } from './locales/es/messages';
import { messages as frClientMessages } from './locales/fr/client-messages';
import { messages as frMessages } from './locales/fr/messages';
import { messages as ukClientMessages } from './locales/uk/client-messages';
import { messages as ukMessages } from './locales/uk/messages';
import { SUPPORTED_LOCALES as locales } from './supported-locales.constant.mjs';
type SupportedLocales = (typeof locales)[number];

export const allMessages: Record<SupportedLocales, Messages> = {
    de: deMessages,
    en: enMessages,
    es: esMessages,
    fr: frMessages,
    uk: ukMessages
};
export const clientMessages: Record<SupportedLocales, Messages> = {
    de: deClientMessages,
    en: enClientMessages,
    es: esClientMessages,
    fr: frClientMessages,
    uk: ukClientMessages
};
const instances: Record<SupportedLocales, I18n> = {};
for (const locale of locales) {
    instances[locale] = setupI18n({ locale, messages: { [locale]: allMessages[locale] } });
}

export const getI18nInstance = (locale: SupportedLocales): I18n => instances[locale];
