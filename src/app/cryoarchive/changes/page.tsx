import type { Metadata } from "next";
import { ChangesClient } from "./ChangesClient";
import { SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Site Changes",
  description: "Detected website deployments and build changes on cryoarchive.systems",
  openGraph: {
    title: "Site Changes // BREACHER.NET",
    description: "Detected website deployments and build changes on cryoarchive.systems",
    url: `${SITE_URL}/cryoarchive/changes`,
  },
};

export default function ChangesPage() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8">
      <ChangesClient />
    </main>
  );
}
