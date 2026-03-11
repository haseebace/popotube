/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  typescript: { ignoreBuildErrors: true },
  experimental: {
    cpus: 1,
    workerThreads: false,
  }
};

export default nextConfig;
