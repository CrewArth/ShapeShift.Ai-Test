/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'img.clerk.com',
      'images.clerk.dev',
      'uploadthing.com',
      'utfs.io',
      'placehold.co',
      'files.stripe.com',
      'storage.googleapis.com',
      'assets.meshy.ai'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.meshy.ai',
        pathname: '/**',
      }
    ]
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
}

module.exports = nextConfig