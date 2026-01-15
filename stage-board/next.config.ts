import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const config = {
  ...nextConfig,
  turbopack: { root: path.resolve(__dirname) }
};

export default config;
