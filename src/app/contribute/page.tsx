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

      {/* Developer note */}
      <section className="mb-12">
        <div className="cryo-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-2xl shrink-0" aria-hidden="true">💻</div>
          <div className="flex-1">
            <p className="text-dim text-sm leading-relaxed">
              <strong className="text-accent">Developers</strong> — breacher.net is fully
              open source (Next.js 16, React 19, TypeScript 5, Tailwind 4, PostgreSQL).
              Check out the{" "}
              <Link href="/community" className="text-accent2 hover:glow-accent2">
                Community Resources
              </Link>{" "}
              page for source code, open issues, and the full tech stack.
            </p>
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
