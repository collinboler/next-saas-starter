/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizeCss: true // Enable CSS optimization
  }
};

module.exports = nextConfig; 