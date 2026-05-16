import type { NextConfig } from "next";

function r2RemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const patterns: NonNullable<
    NonNullable<NextConfig["images"]>["remotePatterns"]
  > = [];

  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (base) {
    try {
      const host = new URL(base).hostname;
      patterns.push({
        protocol: "https",
        hostname: host,
        pathname: "/**",
      });
    } catch {
      // ignore invalid URL at build time
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2RemotePatterns(),
  },
};

export default nextConfig;
