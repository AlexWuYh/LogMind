/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // instrumentationHook: true, // Enabled by default in newer versions, but good to be explicit if issues arise
  },
};

export default nextConfig;
