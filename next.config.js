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
      // API 요청 (analytics 제외)
      urlPattern: /^https?:\/\/.*\/api\/(?!analytics).*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-calls',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5분
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      // Analytics 요청 - 캐싱 안 함
      urlPattern: /^https?:\/\/.*\/api\/analytics.*/,
      handler: 'NetworkOnly'
    },
    {
      // Static 리소스 (이미지, JS, CSS)
      urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|js|css|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7일
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      // Next.js 이미지 최적화
      urlPattern: /^https?:\/\/.*\/_next\/image.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30일
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
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