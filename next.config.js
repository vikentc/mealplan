/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
  },
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
