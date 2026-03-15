import type { Metadata } from "next";
import { fetchStabilization } from "@/lib/api";
import { CamerasClient } from "./CamerasClient";

export const metadata: Metadata = {
  title: "Cameras",
  description: "CCTV stabilization levels across all sectors and cameras",
  openGraph: {
    title: "Cameras // BREACHER.NET",
    description: "CCTV stabilization levels across all sectors and cameras",
    url: "https://breacher.net/cryoarchive/cameras",
  },
};

export const revalidate = 0;

export default async function CamerasPage() {
  const stabilization = await fetchStabilization();

  const initialData = stabilization
    ? Object.fromEntries(
      Object.entries(stabilization).map(([name, cam]) => [
        name,
        {
          stabilizationLevel: cam.stabilizationLevel,
          nextStabilizationAt: cam.nextStabilizationAt,
        },
      ])
    )
    : null;

  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8">
      <CamerasClient initialData={initialData} />
    </main>
  );
}
