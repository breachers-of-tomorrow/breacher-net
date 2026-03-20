import type { Metadata } from "next";
import Link from "next/link";
import { URLS, SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Marathon Metrics",
  description:
    "Marathon game metrics — kill counts, player data, weapon stats, and community analytics from The Breacher Network.",
  openGraph: {
    title: "Marathon Metrics // BREACHER.NET",
    description:
      "Marathon game metrics — kill counts, player data, weapon stats, and community analytics.",
    url: `${SITE_URL}/marathon`,
  },
};

export default function MarathonPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          MARATHON METRICS
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          GAME DATA, ANALYTICS, AND COMMUNITY TOOLS
        </p>
      </div>

      {/* Coming soon notice */}
      <div className="cryo-panel p-8 text-center mb-8">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-accent2 to-accent" />
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-accent2 mb-4">
          COMING SOON
        </div>
        <p className="text-text-body text-sm leading-relaxed max-w-lg mx-auto mb-6">
          Marathon metrics are being relocated from the Cryoarchive dashboard to
          their own dedicated page. Kill counts, player data, analytics, and
          projections will live here.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/cryoarchive"
            className="font-[var(--font-display)] text-xs tracking-[2px] px-4 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors no-underline"
          >
            VIEW CRYOARCHIVE DASHBOARD →
          </Link>
          <a
            href={URLS.weaponsDb}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[var(--font-display)] text-xs tracking-[2px] px-4 py-2 border border-accent2 text-accent2 hover:bg-accent2/10 transition-colors no-underline"
          >
            WEAPONS DATABASE ↗
          </a>
        </div>
      </div>
    </main>
  );
}
