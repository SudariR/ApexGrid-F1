/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true
  }
};

module.exports = nextConfig;
