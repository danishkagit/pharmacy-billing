/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  rewrites: async () => {
    if (process.env.NODE_ENV === 'development') {
      return [{ source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' }];
    }
    return [];
  },
};

module.exports = nextConfig;
