/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  transpilePackages: ['lucide-react'],
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  cssModules: true,
  postcss: true,
};

module.exports = nextConfig; 