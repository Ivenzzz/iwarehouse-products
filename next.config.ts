import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "localhost" }],
    // The image optimizer blocks upstreams that resolve to private IPs (SSRF
    // guard). In development the ERP runs on localhost, so allow it there only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
