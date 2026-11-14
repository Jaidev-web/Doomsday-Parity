/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['10.21.51.15'],
  serverExternalPackages: ['mongodb', 'nodemailer'],
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
