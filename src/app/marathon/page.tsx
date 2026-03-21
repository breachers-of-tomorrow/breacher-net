import type { Metadata } from "next";
import { fetchState, fetchHighWaterCapturedAt } from "@/lib/api";
import { SITE_URL } from "@/lib/urls";
import { MarathonClient } from "./MarathonClient";

export const metadata: Metadata = {
  title: "Marathon Metrics",
  description:
    "Marathon game metrics — kill counts, player data, weapon stats, kill rate analytics, and 500M ETA projection from The Breacher Network.",
  openGraph: {
    title: "Marathon Metrics // BREACHER.NET",
    description:
      "Marathon game metrics — kill counts, player data, weapon stats, and community analytics.",
    url: `${SITE_URL}/marathon`,
  },
};

export const revalidate = 0; // Always fresh

export default async function MarathonPage() {
  const state = await fetchState();

  // Pass initial kill count for SSR hydration
  const initialKillCount = state?.uescKillCount ?? null;

  // Get the captured_at timestamp of the high-water row for staleness detection
  const initialCapturedAt = await fetchHighWaterCapturedAt();

  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 sm:py-16">
      <MarathonClient
        initialKillCount={initialKillCount}
        initialCapturedAt={initialCapturedAt}
      />
    </main>
  );
}
