/** @type {import('next').NextConfig} */
const nextPWA = require('next-pwa')

const isProd = process.env.NODE_ENV === 'production';

const withPWA = nextPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
  buildExcludes: [/dynamic-css-manifest\.json$/],

  // ✅ Android 백그라운드 알림 최적화
  disableDevLogs: true,
  scope: '/',

  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-calls',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ],
  fallbacks: {
    document: '/offline'
  }
})

const nextConfig = {
  reactStrictMode: true,  // Enable React Strict Mode for better development warnings
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
  }
}

module.exports = withPWA(nextConfig)