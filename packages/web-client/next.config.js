/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite conexão com o daemon local
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8420/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
