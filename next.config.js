/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Allow APK uploads larger than Next's default proxy body limit (~10MB)
    proxyClientMaxBodySize: 500 * 1024 * 1024,
  },
};

module.exports = nextConfig;
