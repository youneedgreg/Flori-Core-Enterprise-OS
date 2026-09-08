import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flori-Core Enterprise OS",
    short_name: "Flori-Core",
    description: "The operating system for commercial flower farms.",
    start_url: "/",
    display: "standalone",
    background_color: "#060D0A",
    theme_color: "#060D0A",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
