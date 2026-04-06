/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone" as const,
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
