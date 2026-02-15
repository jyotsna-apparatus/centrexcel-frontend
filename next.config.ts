import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const backend =
      process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5080/api";
    // Log so you can confirm .env was loaded (restart dev server after changing .env)
    console.log("[next.config] Proxying /api/* to:", backend);
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
