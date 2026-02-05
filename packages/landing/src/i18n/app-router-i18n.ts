import 'server-only';

import { I18n, Messages, setupI18n } from '@lingui/core';

import linguiConfig from '../../lingui.config.mjs';

const { locales } = linguiConfig;
type SupportedLocales = (typeof locales)[number];

export const allMessages: Record<SupportedLocales, Messages> = {};
for (const locale of locales) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    allMessages[locale] = (await import(`./locales/${locale}/messages`)).messages as Messages;
}

export const getI18nInstance = (locale: SupportedLocales): I18n => setupI18n({ locale, messages: { [locale]: allMessages[locale] } });
