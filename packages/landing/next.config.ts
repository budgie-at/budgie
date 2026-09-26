import { SUPPORTED_LOCALES } from './src/i18n/supported-locales.constant.mjs';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    reactCompiler: true,
    cacheComponents: true,
    partialPrefetching: true,
    images: {
        formats: ['image/webp'],
        minimumCacheTTL: 2_678_400
    },
    experimental: {
        inlineCss: true,
        swcPlugins: [['@lingui/swc-plugin', {}]],
        useTypeScriptCli: false
    },
    async redirects() {
        return [
            ['ai-merchant-translation', '/features/ai-category-translation'],
            ['statistics-tags-tab', '/features/tag-analytics'],
            ['crypto-price-history', '/features/crypto-investment-tracking'],
            ['on-device-ai-budget-app', '/ai-features'],
            ['open-source-budget-app-mobile', '/open-source'],
            ['offline-first-expense-tracker', '/offline-first'],
            ['private-budget-app-alternative', '/privacy'],
            ['no-bank-login-budget-app', '/privacy'],
            ['convert-to-transfer', '/features/transaction-long-press-menu'],
            ['convert-to-refund', '/features/transaction-long-press-menu']
        ].map(([retiredSlug, destination]) => ({
            source: `/:lang(${SUPPORTED_LOCALES.join('|')})/features/${retiredSlug}`,
            destination: `/:lang${destination}`,
            permanent: true
        }));
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' }
                ]
            },
            {
                source: '/ota/manifest.plist',
                headers: [
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Content-Type', value: 'text/xml' },
                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Cache-Control', value: 'no-store' }
                ]
            }
        ];
    }
};

export default nextConfig;
