import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },           // Uploadthing
      { protocol: 'https', hostname: '*.uploadthing.com' }, // Uploadthing CDN
      { protocol: 'https', hostname: 'replicate.delivery' }, // Replicate IA output
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },
      { protocol: 'https', hostname: 'img.clerk.com' },      // Clerk avatars
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
