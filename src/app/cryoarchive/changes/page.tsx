import type { Metadata } from "next";
import { ChangesClient } from "./ChangesClient";

export const metadata: Metadata = {
  title: "Site Changes",
  description: "Detected website deployments and build changes on cryoarchive.systems",
};

export default function ChangesPage() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8">
      <ChangesClient />
    </main>
  );
}
