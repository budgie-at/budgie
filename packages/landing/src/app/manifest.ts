import type { MetadataRoute } from 'next';

/* eslint-disable lingui/no-unlocalized-strings */
const manifest = (): MetadataRoute.Manifest => ({
    name: 'Budgie - Privacy-First Expense Tracker',
    short_name: 'Budgie',
    description: 'Track expenses, sync banks, manage crypto & stocks with complete privacy. All stored securely on your device.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
        {
            src: '/favicon.ico',
            sizes: 'any',
            type: 'image/x-icon'
        }
    ]
});

export default manifest;
