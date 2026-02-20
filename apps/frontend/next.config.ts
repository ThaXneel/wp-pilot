import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || undefined,
};

export default withNextIntl(nextConfig);
