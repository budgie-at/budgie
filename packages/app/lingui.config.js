import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

export default defineConfig({
    sourceLocale: 'en',
    locales: ['uk', 'en', 'fr', 'de', 'es'],
    format: formatter({ lineNumbers: false }),
    catalogs: [
        {
            path: '<rootDir>/src/i18n/locales/{locale}/messages',
            include: ['src']
        }
    ]
});
