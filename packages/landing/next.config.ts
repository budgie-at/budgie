import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    reactCompiler: true,
    images: {
        formats: ['image/avif', 'image/webp']
    },
    experimental: {
        inlineCss: true,
        swcPlugins: [['@lingui/swc-plugin', {}]],
        useTypeScriptCli: false
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
