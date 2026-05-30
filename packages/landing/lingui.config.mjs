import { formatter } from '@lingui/format-po';

export default {
    sourceLocale: 'en',
    fallbackLocales: {
        default: 'en'
    },
    pseudoLocale: 'pseudo',
    locales: ['uk', 'en', 'fr', 'de', 'es'],
    format: formatter({ lineNumbers: false }),
    catalogs: [
        {
            path: '<rootDir>/src/i18n/locales/{locale}/messages',
            include: ['src']
        }
    ]
};
