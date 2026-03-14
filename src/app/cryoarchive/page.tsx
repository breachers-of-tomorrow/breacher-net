import type { Metadata } from "next";
import { fetchState } from "@/lib/api";
import { SECTOR_NAMES } from "@/lib/types";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live kill count, sector states, ship date countdown, and kill rate chart",
};

export const revalidate = 0; // Always fresh

export default async function CryoarchiveDashboard() {
  const state = await fetchState();

  // Extract initial data for client hydration
  const initialData = state
    ? {
      killCount: state.uescKillCount,
      nextUpdateAt: state.uescKillCountNextUpdateAt,
      shipDate: state.shipDate,
      memoryUnlocked: state.memoryUnlocked,
      memoryCompleted: state.memoryCompleted,
      sectors: Object.fromEntries(
        SECTOR_NAMES.map((name) => [
          name,
          {
            unlocked: state.pages[name]?.unlocked ?? false,
            completed: state.pages[name]?.completed ?? false,
          },
        ])
      ) as Record<string, { unlocked: boolean; completed: boolean }>,
    }
    : null;

  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8">
      <DashboardClient initialData={initialData} />
    </main>
  );
}
