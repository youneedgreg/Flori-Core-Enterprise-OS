import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
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
