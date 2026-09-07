import 'server-only';
import { I18n, Messages, setupI18n } from '@lingui/core';

import { SUPPORTED_LOCALES as locales } from './supported-locales.constant.mjs';
type SupportedLocales = (typeof locales)[number];

export const allMessages: Record<SupportedLocales, Messages> = {};
export const clientMessages: Record<SupportedLocales, Messages> = {};
for (const locale of locales) {
    // eslint-disable-next-line no-await-in-loop,@typescript-eslint/no-unsafe-member-access
    allMessages[locale] = (await import(`./locales/${locale}/messages`)).messages as Messages;
    // eslint-disable-next-line no-await-in-loop,@typescript-eslint/no-unsafe-member-access
    clientMessages[locale] = (await import(`./locales/${locale}/client-messages`)).messages as Messages;
}

export const getI18nInstance = (locale: SupportedLocales): I18n => setupI18n({ locale, messages: { [locale]: allMessages[locale] } });
