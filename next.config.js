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
  // 🚀 서버 사이드 리다이렉트: / → /dashboard (깜빡임 없는 리다이렉트)
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false, // 308 대신 307 사용 (임시 리다이렉트)
      },
    ]
  },
}

module.exports = nextConfig
