/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@andysd/intelligence-core"],
};

module.exports = nextConfig;

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ctbids.com', 'images.ctbids.com'],
  },
};

module.exports = nextConfig;
