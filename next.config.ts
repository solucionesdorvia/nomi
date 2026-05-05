import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },           // Uploadthing v6 CDN
      { protocol: 'https', hostname: '*.uploadthing.com' }, // Uploadthing CDN
      { protocol: 'https', hostname: '*.ufs.sh' },          // Uploadthing v7+ ufsUrl host
      { protocol: 'https', hostname: 'replicate.delivery' }, // Replicate IA output
      { protocol: 'https', hostname: '*.replicate.delivery' }, // subdominios (pbxt, etc.)
      { protocol: 'https', hostname: 'img.clerk.com' },      // Clerk avatars
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
