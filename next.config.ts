/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
