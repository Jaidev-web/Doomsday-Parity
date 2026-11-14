/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongodb', 'nodemailer'],
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
