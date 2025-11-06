import createMDX from '@next/mdx';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true
    },
    typescript: {
        ignoreBuildErrors: true
    },
    experimental: {
        reactCompiler: true,
        inlineCss: true,
        swcPlugins: [['@lingui/swc-plugin', {}]]
    },
    pageExtensions: ['mdx', 'ts', 'tsx']
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
