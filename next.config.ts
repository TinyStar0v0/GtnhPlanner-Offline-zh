import type { NextConfig } from "next";

const datasetBackendUrl = process.env.GTNH_DATASET_BACKEND_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // 自用构建：类型检查单独跑（npx tsc --noEmit）。构建器自带的那次会另起进程，
  // 在某些受限环境里起不来，而且它和 tsc 查的是同一份代码。
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/datasets/gtnh/:version/textures/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Rendered item and fluid art carries a content hash in the basename
        // (the pipeline renames on any byte change), so these are immutable
        // too - and they are most of what a returning browser re-downloads.
        source: "/datasets/gtnh/:version/textures/rendered/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const appRewrites = [
      {
        source: "/umami",
        destination: "http://127.0.0.1:8582/umami",
      },
      {
        source: "/umami/:path*",
        destination: "http://127.0.0.1:8582/umami/:path*",
      },
      {
        source: "/_umami/:path*",
        destination: "http://127.0.0.1:8582/umami/:path*",
      },
    ];

    if (!datasetBackendUrl) {
      return appRewrites;
    }

    return {
      beforeFiles: [
        {
          source: "/api/datasets/:path*",
          destination: `${datasetBackendUrl}/api/datasets/:path*`,
        },
        {
          source: "/datasets/gtnh/:path*",
          destination: `${datasetBackendUrl}/datasets/gtnh/:path*`,
        },
      ],
      afterFiles: appRewrites,
    };
  },
};

export default nextConfig;
