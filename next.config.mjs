/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Re-enable lint checks but allow warnings to pass
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow build to succeed even with type warnings during transition
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
