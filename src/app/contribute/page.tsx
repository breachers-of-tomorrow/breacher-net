import type { Metadata } from "next";
import Link from "next/link";
import { URLS, SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Ways to contribute to Breachers of Tomorrow — ARG research, code, writing, design, community building, and data analysis.",
  openGraph: {
    title: "Contribute // BREACHER.NET",
    description:
      "Find your path. Every Breacher brings something unique to the team.",
    url: `${SITE_URL}/contribute`,
  },
};

interface ContributionPath {
  icon: string;
  title: string;
  tagline: string;
  description: string;
  tasks: string[];
  cta: { label: string; href: string; external?: boolean };
}

const PATHS: ContributionPath[] = [
  {
    icon: "🔍",
    title: "ARG RESEARCH",
    tagline: "Best for: Anyone following the Marathon ARG",
    description:
      "Track changes on cryoarchive.systems, document discoveries, share findings, and help organize research into structured wiki pages.",
    tasks: [
      "Track sector changes and kill count patterns",
      "Document discoveries in the Community Doc",
      "Share findings in Discord #arg-general",
      "Help structure research into wiki articles",
    ],
    cta: { label: "OPEN COMMUNITY DOC", href: URLS.communityDoc, external: true },
  },
  {
    icon: "💻",
    title: "CODE & TOOLS",
    tagline: "Best for: Developers, designers, data enthusiasts",
    description:
      "Contribute to breacher.net, build data visualizations, improve the poller service, or hack on your own community tools.",
    tasks: [
      "Fix bugs or build features — check open issues",
      "Improve data visualizations and charts",
      "Help with the Python poller service",
      "Build analysis tools or browser extensions",
    ],
    cta: { label: "VIEW OPEN ISSUES", href: `${URLS.breacherNetRepo}/issues`, external: true },
  },
  {
    icon: "📝",
    title: "WRITING & DOCS",
    tagline: "Best for: Writers, editors, organizers",
    description:
      "Migrate research from the Google Doc to structured wiki pages, write guides for new members, and document ARG theories with evidence.",
    tasks: [
      "Help migrate research to wiki pages",
      "Write onboarding guides for new members",
      "Document theories with supporting evidence",
      "Improve existing documentation and README files",
    ],
    cta: { label: "OPEN WIKI", href: URLS.wiki, external: true },
  },
  {
    icon: "🎨",
    title: "DESIGN & BRANDING",
    tagline: "Best for: Designers, artists, creative types",
    description:
      "Help develop the community's visual identity — social graphics, Discord assets, event banners, and brand guide contributions.",
    tasks: [
      "Create social media graphics and banners",
      "Design Discord server assets and emotes",
      "Contribute to the community brand guide",
      "Design infographics for ARG data",
    ],
    cta: { label: "VIEW BRAND GUIDE", href: `${URLS.github}/community/blob/main/branding/BRAND-GUIDE.md`, external: true },
  },
  {
    icon: "🎙️",
    title: "COMMUNITY",
    tagline: "Best for: Social people, event organizers, moderators",
    description:
      "Welcome new members, organize community events, moderate discussions, and help share community content on social media.",
    tasks: [
      "Welcome and guide new members in Discord",
      "Organize events — raid nights, solving sessions",
      "Help moderate discussions",
      "Share community content on social platforms",
    ],
    cta: { label: "JOIN DISCORD", href: URLS.discord, external: true },
  },
  {
    icon: "📊",
    title: "DATA & ANALYSIS",
    tagline: "Best for: Data enthusiasts, spreadsheet warriors",
    description:
      "Track sector data, kill counts, and stabilization patterns. Build charts, validate theories with evidence, and maintain community datasets.",
    tasks: [
      "Track sector states and stabilization patterns",
      "Create charts and data visualizations",
      "Validate theories with quantitative evidence",
      "Maintain community tracking spreadsheets",
    ],
    cta: { label: "VIEW DASHBOARD", href: "/cryoarchive" },
  },
];

export default function ContributePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          CONTRIBUTE
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto mb-2">
          FIND YOUR PATH — EVERY BREACHER BRINGS SOMETHING UNIQUE
        </p>
        <p className="text-dim/60 text-xs tracking-[1px] max-w-xl mx-auto">
          No contribution is too small. Every data point tracked, every question answered,
          and every discovery shared makes the community stronger.
        </p>
      </div>

      {/* Contribution Paths */}
      <section className="mb-12">
        <div className="section-title">CONTRIBUTION PATHS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PATHS.map((path) => (
            <PathCard key={path.title} path={path} />
          ))}
        </div>
      </section>

      {/* Getting Started */}
      <section className="mb-12">
        <div className="section-title">GETTING STARTED</div>
        <div className="cryo-panel p-6 sm:p-8">
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="font-[var(--font-display)] text-accent text-xs tracking-[2px] shrink-0 mt-0.5">01</span>
              <div>
                <div className="text-foreground font-medium mb-0.5">Pick what interests you</div>
                <p className="text-dim text-xs leading-relaxed">
                  Browse the paths above — research, code, writing, design, community, or data.
                  You can always switch later.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-[var(--font-display)] text-accent text-xs tracking-[2px] shrink-0 mt-0.5">02</span>
              <div>
                <div className="text-foreground font-medium mb-0.5">Join the right channels</div>
                <p className="text-dim text-xs leading-relaxed">
                  <code className="text-accent2 text-[0.65rem]">#arg-general</code> for research,{" "}
                  <code className="text-accent2 text-[0.65rem]">#coders</code> for dev work,{" "}
                  <code className="text-accent2 text-[0.65rem]">#breacher-net</code> for general chat.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-[var(--font-display)] text-accent text-xs tracking-[2px] shrink-0 mt-0.5">03</span>
              <div>
                <div className="text-foreground font-medium mb-0.5">Start small</div>
                <p className="text-dim text-xs leading-relaxed">
                  Fix a typo, add a data point, answer a question, share a discovery.
                  Small actions compound.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-[var(--font-display)] text-accent text-xs tracking-[2px] shrink-0 mt-0.5">04</span>
              <div>
                <div className="text-foreground font-medium mb-0.5">Ask for help</div>
                <p className="text-dim text-xs leading-relaxed">
                  The Keepers and community are here to support you. No question is too basic.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Tech Stack (for developers) */}
      <section className="mb-12">
        <div className="section-title">FOR DEVELOPERS</div>
        <div className="cryo-panel p-6 sm:p-8">
          <p className="text-dim text-sm leading-relaxed mb-4">
            breacher.net is fully open source. Here&apos;s the stack:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Framework", value: "Next.js 16" },
              { label: "UI", value: "React 19" },
              { label: "Language", value: "TypeScript 5" },
              { label: "Styling", value: "Tailwind CSS 4" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Poller", value: "Python" },
            ].map((item) => (
              <div key={item.label} className="bg-background/50 border border-border/50 px-3 py-2">
                <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-dim mb-0.5">
                  {item.label.toUpperCase()}
                </div>
                <div className="text-accent2 text-xs">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href={URLS.breacherNetRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              VIEW SOURCE
            </a>
            <a
              href={`${URLS.breacherNetRepo}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
            >
              OPEN ISSUES
            </a>
            <Link
              href="/api-docs"
              className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
            >
              API DOCS
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/community"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
        >
          COMMUNITY →
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

function PathCard({ path }: { path: ContributionPath }) {
  const isInternal = !path.cta.external;
  const LinkComponent = isInternal ? Link : "a";
  const externalProps = isInternal
    ? {}
    : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <div className="cryo-panel p-6 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl shrink-0" aria-hidden="true">
          {path.icon}
        </span>
        <div>
          <h3 className="font-[var(--font-display)] text-xs tracking-[3px] text-accent mb-1">
            {path.title}
          </h3>
          <p className="text-dim/60 text-[0.65rem] italic">{path.tagline}</p>
        </div>
      </div>
      <p className="text-dim text-sm leading-relaxed mb-3">{path.description}</p>
      <ul className="space-y-1.5 mb-4 flex-1">
        {path.tasks.map((task) => (
          <li key={task} className="flex gap-2 text-xs text-dim/80">
            <span className="text-accent2 shrink-0 mt-0.5">▸</span>
            {task}
          </li>
        ))}
      </ul>
      <LinkComponent
        href={path.cta.href}
        {...externalProps}
        className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase px-4 py-2.5 bg-accent/10 border border-accent/50 text-accent hover:bg-accent/20 hover:border-accent transition-colors no-underline text-center inline-flex items-center justify-center gap-2"
      >
        {path.cta.label}
        {path.cta.external && (
          <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
        {!path.cta.external && " →"}
      </LinkComponent>
    </div>
  );
}
