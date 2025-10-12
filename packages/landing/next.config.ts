import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
    experimental: {
        reactCompiler: true,
        inlineCss: true,
    },
}

export default nextConfig
