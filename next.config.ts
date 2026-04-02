import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  serverExternalPackages: ['jspdf', 'fflate', 'firebase-admin'],
};

export default nextConfig;
