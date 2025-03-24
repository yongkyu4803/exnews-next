/** @type {import('next').NextConfig} */
const nextPWA = require('next-pwa')

const isProd = process.env.NODE_ENV === 'production';

const withPWA = nextPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
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
  reactStrictMode: false,
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
    unoptimized: true
  }
}

module.exports = withPWA(nextConfig)