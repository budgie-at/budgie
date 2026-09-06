/* oxlint-disable lingui/no-unlocalized-strings */
import { BASE_URL } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
    name: 'Budgie - Privacy-First Expense Tracker',
    short_name: 'Budgie',
    description: 'Track expenses, sync banks, manage crypto & stocks with complete privacy. All stored securely on your device.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    id: BASE_URL,
    icons: [
        {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
        }
    ]
});

export default manifest;
