import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  serverExternalPackages: ['jspdf', 'fflate'],
};

export default nextConfig;
