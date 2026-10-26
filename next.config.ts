import type { NextConfig } from "next";

// GitHub Pages serves a project site from /<repo>. Set NEXT_PUBLIC_BASE_PATH=/portfolio
// for hk-sinha.github.io/portfolio, or leave it empty for a custom domain / user site.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
