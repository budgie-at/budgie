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
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
                ]
            }
        ];
    }
};

export default nextConfig;
