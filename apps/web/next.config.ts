import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "flori-core",
  project: "web",
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
