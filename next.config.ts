import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora los errores de tipos al compilar en Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora las advertencias de ESLint al compilar
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
