import type { Metadata } from "next";
import Link from "next/link";
import { URLS } from "@/lib/urls";
import { SITE_URL } from "@/lib/urls";

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

      {/* Get Started */}
      <section className="mb-12">
        <div className="section-title">GET STARTED</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Step
            number="01"
            title="JOIN THE DISCORD"
            description="The heart of the community. Key channels: #general, #announcements, #lfg-breach-protocol"
            href={URLS.discord}
            cta="JOIN DISCORD"
          />
          <Step
            number="02"
            title="CHECK THE DASHBOARD"
            description="Live kill count, sector states, camera stabilization, site changes, and terminal maps"
            href="/cryoarchive"
            cta="OPEN DASHBOARD"
            internal
          />
          <Step
            number="03"
            title="READ THE RESEARCH"
            description="Community objectives, historical data from Winnower Garden, and Tau Ceti resources"
            href={URLS.communityDoc}
            cta="COMMUNITY DOC"
          />
          <Step
            number="04"
            title="CONTRIBUTE"
            description="From ARG research to code contributions — there's a path for every skill set"
            href="/community"
            cta="SEE HOW"
            internal
          />
        </div>
      </section>

      {/* Ways to Contribute */}
      <section className="mb-12">
        <div className="section-title">WAYS TO CONTRIBUTE</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ContributionPath
            icon="🔍"
            title="ARG RESEARCH"
            description="Track cryoarchive changes, document findings, share theories in Discord thinking pods"
          />
          <ContributionPath
            icon="💻"
            title="CODE & TOOLS"
            description="Contribute to breacher.net (Next.js/React/TypeScript), pollers (Python), or build new tools"
          />
          <ContributionPath
            icon="✍️"
            title="WRITING & DOCS"
            description="Help migrate community research to the wiki, write guides, document lore and theories"
          />
          <ContributionPath
            icon="🎨"
            title="DESIGN & BRANDING"
            description="Visual identity, social media graphics, Discord assets, community brand development"
          />
          <ContributionPath
            icon="🤝"
            title="COMMUNITY BUILDING"
            description="Welcome new members, organize events, moderate channels, build connections"
          />
          <ContributionPath
            icon="📊"
            title="DATA & ANALYSIS"
            description="Track sector data, analyze kill count trends, monitor stabilization patterns"
          />
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

      {/* Credits */}
      <section className="mb-12">
        <div className="section-title">CREDITS</div>
        <div className="cryo-panel p-6 sm:p-8 space-y-3">
          <CreditLine
            label="ORIGINAL TRACKER"
            name="CrowdTypical"
            href={URLS.crowdTypical}
          />
          <CreditLine
            label="HISTORICAL DATA"
            name="Winnower Garden"
            href={URLS.winnower}
          />
          <CreditLine
            label="COMMUNITY"
            name="Breachers of Tomorrow"
            href={URLS.github}
          />
        </div>
      </section>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/community"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
        >
          COMMUNITY RESOURCES →
        </Link>
        <Link
          href="/cryoarchive"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
        >
          OPEN DASHBOARD →
        </Link>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  description,
  href,
  cta,
  internal,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  internal?: boolean;
}) {
  const Component = internal ? Link : "a";
  const externalProps = internal
    ? {}
    : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <Component
      href={href}
      {...externalProps}
      className="cryo-panel p-6 hover:border-accent transition-colors no-underline group"
    >
      <div className="flex items-start gap-4">
        <div className="font-[var(--font-display)] text-2xl font-black text-accent/20 shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-2">
            {title}
          </div>
          <p className="text-dim text-sm leading-relaxed mb-3">
            {description}
          </p>
          <div className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-accent2 group-hover:glow-accent2">
            {cta} →
          </div>
        </div>
      </div>
    </Component>
  );
}

function ContributionPath({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="cryo-panel p-5">
      <div className="text-2xl mb-3" aria-hidden="true">
        {icon}
      </div>
      <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent mb-2">
        {title}
      </div>
      <p className="text-dim text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function CreditLine({
  label,
  name,
  href,
}: {
  label: string;
  name: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim shrink-0">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:glow-accent"
      >
        {name}
      </a>
    </div>
  );
}
