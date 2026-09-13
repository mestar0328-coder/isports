import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iSports",
    short_name: "iSports",
    description: "Discover and register for sports events.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}