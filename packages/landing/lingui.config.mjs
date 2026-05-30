import { formatter } from '@lingui/format-po';

import { SUPPORTED_LOCALES } from './src/i18n/supported-locales.constant.mjs';

export default {
    sourceLocale: 'en',
    fallbackLocales: {
        default: 'en'
    },
    pseudoLocale: 'pseudo',
    locales: SUPPORTED_LOCALES,
    format: formatter({ lineNumbers: false }),
    catalogs: [
        {
            path: '<rootDir>/src/i18n/locales/{locale}/messages',
            include: ['src']
        }
    ]
};
