import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BREACHER.NET — Breachers of Tomorrow",
    short_name: "BREACHER.NET",
    description:
      "Community tracker and hub for the Marathon ARG — live kill count, sector states, stabilization data, and interactive maps.",
    start_url: "/",
    display: "standalone",
    background_color: "#031A22",
    theme_color: "#038ADF",
    icons: [
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
