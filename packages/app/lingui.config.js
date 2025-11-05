import { defineConfig } from '@lingui/cli';

export default defineConfig({
    sourceLocale: 'en',
    locales: ['uk', 'en', 'fr', 'de', 'es'],
    catalogs: [
        {
            path: '<rootDir>/src/locales/{locale}/messages',
            include: ['src']
        }
    ]
});
