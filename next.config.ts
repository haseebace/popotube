/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:3001'}/api/:path*`, // Proxy to Fastify Backend natively for streaming
      },
    ];
  },
};

export default nextConfig;
