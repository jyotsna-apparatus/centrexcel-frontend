import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/hackathons", destination: "/challenges", permanent: false },
      { source: "/hackathons/new", destination: "/challenges/new", permanent: false },
      { source: "/hackathons/approvals", destination: "/challenges/approvals", permanent: false },
      { source: "/hackathons/:id", destination: "/challenges/:id", permanent: false },
      { source: "/hackathons/:id/edit", destination: "/challenges/:id/edit", permanent: false },
      { source: "/hackathons/:id/apply", destination: "/challenges/:id/enroll", permanent: false },
      { source: "/hackathons/:id/submit", destination: "/challenges/:id/submit", permanent: false },
    ];
  },
  async rewrites() {
    let backend =
      process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:5080/api";
    // Backend serves routes under /api (e.g. /api/auth/login). Ensure destination includes /api.
    if (!backend.endsWith("/api")) {
      backend = `${backend}/api`;
    }
    console.log("[next.config] Proxying /api/* to:", backend);
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
