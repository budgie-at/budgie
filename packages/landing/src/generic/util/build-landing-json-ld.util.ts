/* oxlint-disable lingui/no-unlocalized-strings */
import { msg } from '@lingui/core/macro';

import { BASE_URL } from '../constant/seo.constant';

import type { I18n } from '@lingui/core';

export const buildLandingJsonLd = (i18n: I18n): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Budgie',
    applicationCategory: 'FinanceApplication',
    applicationSubCategory: 'PersonalFinance',
    operatingSystem: 'iOS, Android',
    description: i18n._(msg`Privacy-first expense tracker that keeps your financial data on your device.`),
    url: BASE_URL,
    image: `${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`,
    featureList: [
        i18n._(msg`Offline-first expense tracking`),
        i18n._(msg`On-device AI auto-categorization`),
        i18n._(msg`Voice transaction entry`),
        i18n._(msg`Monobank bank sync`),
        i18n._(msg`CSV and PDF import`),
        i18n._(msg`Net worth tracker`),
        i18n._(msg`Multi-currency`),
        i18n._(msg`On-device encryption`),
        i18n._(msg`PIN and biometric lock`),
        i18n._(msg`Screenshot protection`),
        i18n._(msg`Database backup and restore`)
    ],
    author: { '@type': 'Organization', name: 'Budgie', url: BASE_URL },
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreOrder',
        url: `${BASE_URL}/en`
    }
});
