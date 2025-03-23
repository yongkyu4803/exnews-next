/** @type {import('next').NextConfig} */
const nextPWA = require('next-pwa')

const withPWA = nextPWA({
  dest: 'public',
  disable: false,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200
        }
      }
    }
  ]
})

const nextConfig = {
  reactStrictMode: true,
  // 문제가 되는 패키지들을 트랜스파일하도록 설정
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
  // 기존 설정이 있다면 유지
}

module.exports = withPWA(nextConfig)