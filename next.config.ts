import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    let backend =
      process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5080/api";
    // Backend serves routes under /api (e.g. /api/auth/login). Ensure destination includes /api.
    if (!backend.endsWith("/api")) {
      backend = `${backend}/api`;
    }
    console.log("[next.config] Proxying /api/* to:", backend);
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
