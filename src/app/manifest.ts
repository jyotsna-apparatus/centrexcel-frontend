import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Centrexcel",
    short_name: "Centrexcel",
    description: "Centrexcel - Progressive Web App",
    start_url: "/",
    display: "standalone",
    background_color: "#191917",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon",
        sizes: "192x192 512x512",
        type: "image/png",
        // purpose: "any maskable",
      },
    ],
  };
}
