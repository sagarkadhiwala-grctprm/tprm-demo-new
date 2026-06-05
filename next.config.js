import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js 20 standard declaration for ignoring serverless compilation boundaries
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // In Next.js 20, use standard object assignment for target aliases
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;