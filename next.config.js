/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.dhlottery.co.kr'],
  },
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
};

module.exports = nextConfig;
