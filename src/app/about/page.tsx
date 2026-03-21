import type { Metadata } from "next";
import Link from "next/link";
import { URLS, SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "About",
  description:
    "Breachers of Tomorrow — a 1,500+ member community and The Breacher Network for Marathon by Bungie. Who we are, what we do, and how to join.",
  openGraph: {
    title: "About // BREACHER.NET",
    description:
      "Breachers of Tomorrow — a 1,500+ member community behind The Breacher Network.",
    url: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          BREACHERS OF TOMORROW
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          THE BREACHER NETWORK — MARATHON COMMUNITY HUB
        </p>
      </div>

      {/* What Is This */}
      <section className="mb-12">
        <div className="section-title">WHAT IS THIS?</div>
        <div className="cryo-panel p-6 sm:p-8 space-y-4">
          <p className="text-foreground text-sm sm:text-base leading-relaxed">
            <strong className="text-accent">Breachers of Tomorrow</strong> is a
            1,500+ member community built around the{" "}
            <a
              href={URLS.cryoarchive}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:glow-accent2"
            >
              Marathon ARG
            </a>{" "}
            by Bungie. We collaboratively solve puzzles, track changes to
            cryoarchive.systems, and share discoveries.
          </p>
          <p className="text-dim text-sm leading-relaxed">
            Bungie launched{" "}
            <a
              href={URLS.cryoarchive}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:glow-accent2"
            >
              cryoarchive.systems
            </a>{" "}
            featuring sectors, camera feeds, a kill counter, and terminal maps.
            This community tracks it all in real-time through breacher.net —
            including live data feeds, stabilization monitoring, build change
            detection, and interactive maps.
          </p>
        </div>
      </section>

      {/* Community Structure */}
      <section className="mb-12">
        <div className="section-title">COMMUNITY STRUCTURE</div>
        <div className="cryo-panel p-6 sm:p-8">
          <p className="text-dim text-sm leading-relaxed mb-4">
            Breachers of Tomorrow is managed by a team of ~15 volunteer{" "}
            <strong className="text-accent">
              Keepers of The Manifest
            </strong>{" "}
            — experienced community members who help guide research, moderate
            discussions, and maintain infrastructure.
          </p>
          <p className="text-dim text-sm leading-relaxed">
            Everyone is welcome to contribute at their own pace. No pressure, no
            gatekeeping — just a shared love for solving the mysteries of the
            Marathon ARG.
          </p>
        </div>
      </section>

      {/* Next steps */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/contribute"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
        >
          GET INVOLVED →
        </Link>
        <Link
          href="/community"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
        >
          COMMUNITY RESOURCES →
        </Link>
      </div>
    </main>
  );
}
