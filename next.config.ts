import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  // lib/export/pdf.ts reads the CJK font chunks from disk at runtime; @sparticuz/chromium unpacks its brotli bin/ at runtime
  outputFileTracingIncludes: {
    '/api/export/pdf': [
      './node_modules/@fontsource/noto-sans-sc/400.css',
      './node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-*-400-normal.woff2',
      './node_modules/@sparticuz/chromium/bin/**',
    ],
  },
  // the tracer would otherwise ship the whole 75 MB package (all weights, .woff, scss)
  outputFileTracingExcludes: {
    '/api/export/pdf': [
      './node_modules/@fontsource/noto-sans-sc/files/*-{100,200,300,500,600,700,800,900}-normal*',
      './node_modules/@fontsource/noto-sans-sc/files/*.woff',
      './node_modules/@fontsource/noto-sans-sc/scss/**',
      './node_modules/@fontsource/noto-sans-sc/*-*.css',
      './node_modules/@fontsource/noto-sans-sc/{1,2,3,5,6,7,8,9}00.css',
    ],
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
