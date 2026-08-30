/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@storeforge/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
