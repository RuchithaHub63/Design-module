import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Point Turbopack at the actual Next.js app directory
    root: path.join(__dirname, 'stage-board'),
  },
};

export default nextConfig;
