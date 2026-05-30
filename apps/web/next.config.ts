import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Consume the workspace package as TypeScript source (Turborepo JIT pattern).
  transpilePackages: ["@sentinel/shared"],
  // Linting is owned by the dedicated `pnpm lint` (turbo) task, which applies
  // the Next.js rules via @sentinel/config. Skip Next's build-time re-lint.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
