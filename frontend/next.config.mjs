/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['10.165.96.141'],
  serverExternalPackages: ['mongodb', 'nodemailer'],
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
