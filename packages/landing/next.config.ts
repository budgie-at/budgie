import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    reactCompiler: true,
    experimental: {
        inlineCss: true,
        swcPlugins: [['@lingui/swc-plugin', {}]]
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
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
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
