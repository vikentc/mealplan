/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.arla.com' },
      { protocol: 'https', hostname: 'www.zeta.nu' },
      { protocol: 'https', hostname: 'assets.icanet.se' },
      { protocol: 'https', hostname: 'www.jocooks.com' },
      { protocol: 'https', hostname: 'img.koket.se' },
      { protocol: 'https', hostname: 'vasterbottensost.com' },
      { protocol: 'https', hostname: 'www.niiinis.se' },
      { protocol: 'https', hostname: 'mykitchenstories.se' },
      { protocol: 'https', hostname: 'alltommat.expressen.se' },
      { protocol: 'https', hostname: 'www.themissinglokness.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.recept.se' },
      { protocol: 'https', hostname: 'www.petitchef.se' },
      { protocol: 'https', hostname: 'static.bonniernews.se' },
      { protocol: 'https', hostname: 'eu-central-1.linodeobjects.com' }
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
