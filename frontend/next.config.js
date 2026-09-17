/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://backend:8000'
        : 'http://127.0.0.1:8000');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
