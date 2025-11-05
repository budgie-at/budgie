export default {
    sourceLocale: 'en',
    pseudoLocale: 'pseudo',
    locales: ['uk', 'en', 'fr', 'de', 'es'],
    catalogs: [
        {
            path: '<rootDir>/src/i18n/locales/{locale}/messages',
            include: ['src']
        }
    ]
};
