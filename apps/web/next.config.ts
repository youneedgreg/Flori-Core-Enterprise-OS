import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output is for the Docker image (apps/web/Dockerfile).
  // Vercel produces its own output format, so skip it there.
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "flori-core",
  project: "web",
  widenClientFileUpload: true,
});
