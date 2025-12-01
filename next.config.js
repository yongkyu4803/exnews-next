/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // Enable React Strict Mode for better development warnings
  eslint: {
    ignoreDuringBuilds: true,  // Temporarily ignore ESLint during builds
  },
  transpilePackages: [
    'rc-util',
    'rc-tree',
    'rc-input',
    'antd',
    '@ant-design',
    'rc-pagination',
    'rc-picker',
    '@rc-component',
    'rc-table'
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  // 🚀 Redirect disabled for Google AdSense approval
  // After AdSense approval, you can re-enable this redirect
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/dashboard',
  //       permanent: false,
  //     },
  //   ]
  // },
}

module.exports = nextConfig
