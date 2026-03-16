import type { Metadata } from "next";
import Link from "next/link";
import { URLS, SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Community Resources",
  description:
    "Links, tools, and resources for the Breachers of Tomorrow community — Discord, wiki, research docs, developer tools, and more.",
  openGraph: {
    title: "Community Resources // BREACHER.NET",
    description:
      "Links, tools, and resources for the Breachers of Tomorrow community.",
    url: `${SITE_URL}/community`,
  },
};

export default function CommunityPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          COMMUNITY RESOURCES
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          EVERYTHING YOU NEED TO JOIN THE BREACH PROTOCOL EFFORT
        </p>
      </div>

      {/* Primary Community Hubs */}
      <section className="mb-12">
        <div className="section-title">COMMUNITY HUBS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResourceCard
            icon="💬"
            title="DISCORD"
            description="The heart of Breachers of Tomorrow. 1,000+ members solving puzzles, sharing discoveries, and coordinating research."
            href={URLS.discord}
            cta="JOIN SERVER"
            accent
          />
          <ResourceCard
            icon="📖"
            title="WIKI"
            description="Marathon lore, sector documentation, character profiles, ARG timeline, and community research."
            href={URLS.wiki}
            cta="OPEN WIKI"
            accent
          />
          <ResourceCard
            icon="📋"
            title="COMMUNITY DOC"
            description="Current objectives, active research threads, and coordination for the Breach Protocol effort."
            href={URLS.communityDoc}
            cta="VIEW DOC"
          />
          <ResourceCard
            icon="💡"
            title="DISCUSSIONS"
            description="GitHub Discussions for asynchronous Q&A, ideas, and community conversations."
            href={URLS.discussions}
            cta="JOIN DISCUSSION"
          />
        </div>
      </section>

      {/* Trackers & Data */}
      <section className="mb-12">
        <div className="section-title">TRACKERS &amp; DATA</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceCard
            icon="📡"
            title="DASHBOARD"
            description="Live kill count, sector states, ship date countdown, and kill rate chart."
            href="/cryoarchive"
            cta="OPEN DASHBOARD"
            internal
          />
          <ResourceCard
            icon="📷"
            title="CAMERAS"
            description="CCTV stabilization levels, alerts, and stabilization history chart."
            href="/cryoarchive/cameras"
            cta="VIEW CAMERAS"
            internal
          />
          <ResourceCard
            icon="🗺️"
            title="MAPS"
            description="Interactive terminal maps for Perimeter, Dire Marsh, and Outpost."
            href="/cryoarchive/maps"
            cta="EXPLORE MAPS"
            internal
          />
          <ResourceCard
            icon="📂"
            title="INDEX ARCHIVE"
            description="1,200+ cryoarchive entries — types, lock status, and content data."
            href="/cryoarchive/index"
            cta="BROWSE INDEX"
            internal
          />
          <ResourceCard
            icon="🔄"
            title="SITE CHANGES"
            description="Detected deployments and build changes on cryoarchive.systems."
            href="/cryoarchive/changes"
            cta="VIEW CHANGES"
            internal
          />
          <ResourceCard
            icon="🌱"
            title="WINNOWER GARDEN"
            description="Comprehensive historical ARG data going back to the beginning. If you need older data, Winnower has it."
            href={URLS.winnower}
            cta="VIEW ARCHIVE"
          />
        </div>
      </section>

      {/* External Resources */}
      <section className="mb-12">
        <div className="section-title">EXTERNAL RESOURCES</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResourceCard
            icon="🌐"
            title="CRYOARCHIVE"
            description="The official in-universe site this community tracks. Sectors, cameras, terminal maps, and the kill counter."
            href={URLS.cryoarchive}
            cta="VISIT SITE"
          />
          <ResourceCard
            icon="🪐"
            title="TAU CETI WORLD"
            description="Community project exploring connections between the Marathon ARG and broader universe."
            href={URLS.tauCeti}
            cta="EXPLORE"
          />
        </div>
      </section>

      {/* For Developers */}
      <section className="mb-12">
        <div className="section-title">FOR DEVELOPERS</div>
        <div className="cryo-panel p-6 sm:p-8">
          <p className="text-dim text-sm leading-relaxed mb-4">
            breacher.net is open source. Built with Next.js 16, React 19,
            TypeScript, Tailwind v4, and PostgreSQL. Contributions welcome.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={URLS.breacherNetRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              VIEW SOURCE
            </a>
            <a
              href={URLS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
            >
              GITHUB ORG
            </a>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/about"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
        >
          ABOUT US →
        </Link>
        <Link
          href="/"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
        >
          HOME →
        </Link>
      </div>
    </main>
  );
}

function ResourceCard({
  icon,
  title,
  description,
  href,
  cta,
  internal,
  accent,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  internal?: boolean;
  accent?: boolean;
}) {
  const Component = internal ? Link : "a";
  const externalProps = internal
    ? {}
    : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <Component
      href={href}
      {...externalProps}
      className={`cryo-panel p-6 flex items-start gap-4 hover:border-accent transition-colors no-underline group ${accent ? "border-accent/30" : ""
        }`}
    >
      <div className="text-2xl shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1.5">
          {title}
        </div>
        <p className="text-dim text-sm leading-relaxed mb-2">{description}</p>
        <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-accent2 group-hover:glow-accent2">
          {cta} →
        </div>
      </div>
    </Component>
  );
}
