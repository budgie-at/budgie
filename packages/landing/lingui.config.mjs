import { defineConfig } from '@lingui/cli';

export default defineConfig({
    sourceLocale: 'en',
    pseudoLocale: 'pseudo',
    locales: ['uk', 'en', 'fr', 'de', 'es'],
    catalogs: [
        {
            path: '<rootDir>src/i18n/locales/{locale}',
            include: ['src']
        }
    ]
});
