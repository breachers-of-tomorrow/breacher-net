import type { Metadata } from "next";
import { MapsClient } from "./MapsClient";

export const metadata: Metadata = {
  title: "Maps",
  description:
    "Interactive terminal maps for Perimeter, Dire Marsh, and Outpost sectors with zone inspection and stabilization data.",
  openGraph: {
    title: "Maps // BREACHER.NET",
    description:
      "Interactive terminal maps for Perimeter, Dire Marsh, and Outpost sectors with zone inspection and stabilization data.",
    url: "https://breacher.net/cryoarchive/maps",
  },
};

export default function MapsPage() {
  return (
    <main className="px-4 sm:px-8 max-w-[1400px] mx-auto py-8">
      <div className="section-title">TERMINAL MAPS</div>
      <MapsClient />
    </main>
  );
}
