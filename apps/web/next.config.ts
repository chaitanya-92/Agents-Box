import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentverse/config"],
  typedRoutes: true
};

export default nextConfig;
