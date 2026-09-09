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
    // Two sets, because they are not interchangeable: a maskable icon is
    // padded so a launcher can crop it to any shape, which leaves it looking
    // undersized anywhere that does not crop. Next's Manifest type takes one
    // purpose per entry rather than the space-separated form the spec allows.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
