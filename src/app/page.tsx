import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchSteamPlayerCount } from "@/lib/api";
import { SITE_URL, URLS } from "@/lib/urls";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Breacher Network — Marathon Community Hub",
  description:
    "The Breacher Network — Marathon community hub by Breachers of Tomorrow. Game metrics, ARG archive, wiki, weapons database, and 1,500+ members. Join us.",
  openGraph: {
    title: "BREACHER.NET // The Breacher Network",
    description:
      "Marathon community hub — game metrics, ARG archive, wiki, weapons database, and 1,500+ Breachers.",
    url: SITE_URL,
  },
};

export default async function HomePage() {
  const steamPlayers = await fetchSteamPlayerCount();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* ── Hero ── */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt=""
            width={72}
            height={65}
            className="w-[72px] h-auto drop-shadow-[0_0_16px_rgba(3,138,223,0.5)]"
            priority
          />
        </div>
        <h1 className="font-[var(--font-display)] text-3xl sm:text-5xl font-black text-accent glow-accent tracking-[6px] mb-3">
          BREACHER<span className="text-accent2">{"//"}</span>NET
          <span className="cursor-blink text-mint ml-1" aria-hidden="true">▊</span>
        </h1>
        <p className="font-[var(--font-display)] text-base sm:text-xl font-bold text-text-heading tracking-[4px] mb-2">
          THE BREACHER NETWORK
        </p>
        <p className="font-[var(--font-display)] text-xs sm:text-sm text-dim tracking-[3px] mb-4">
          BREACHERS OF TOMORROW
        </p>
        <p className="font-[var(--font-display)] text-[0.65rem] sm:text-xs tracking-[5px] text-accent2/70">
          CONNECT{" "}
          <span className="text-border mx-1">{"//"}
          </span>{" "}BUILD{" "}
          <span className="text-border mx-1">{"//"}
          </span>{" "}RUN
        </p>

        {/* Drop to Shell — link to ssh.breacher.net */}
        <a
          href="https://ssh.breacher.net"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open interactive terminal session at ssh.breacher.net"
          className="inline-block mt-5 font-[var(--font-mono)] text-[0.65rem] sm:text-xs tracking-[3px] text-mint/70 hover:text-mint hover:glow-mint transition-all no-underline"
        >
          {">_"} DROP TO SHELL
        </a>
      </div>

      {/* ── Live Status Strip ── */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 mb-12 sm:mb-14 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
          <span className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
            STEAM PLAYERS
          </span>
          <span className="font-[var(--font-display)] text-sm font-bold text-mint glow-mint tracking-wider">
            {steamPlayers !== null ? steamPlayers.toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-accent2 animate-pulse" />
          <span className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
            DATA FEED
          </span>
          <Link
            href="/status"
            className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-accent2 hover:glow-accent2 transition-all no-underline"
          >
            ONLINE
          </Link>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "BREACHER.NET",
            alternateName: "The Breacher Network",
            url: SITE_URL,
            description:
              "Marathon community hub by Breachers of Tomorrow — game metrics, ARG archive, wiki, and community tools.",
            publisher: {
              "@type": "Organization",
              name: "Breachers of Tomorrow",
              url: SITE_URL,
            },
          }),
        }}
      />

      {/* ── BREACHER NET — Community ── */}
      <h2 className="section-title">BREACHER NET</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <ExternalCard
          href={URLS.discord}
          icon="💬"
          title="DISCORD"
          description="Join 1,500+ Breachers — the primary community hub"
        />
        <ExternalCard
          href={URLS.wiki}
          title="WIKI"
          description="Marathon lore, sectors, characters, and resources"
          customIcon={
            <Image
              src="/wiki-logo.svg"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7"
            />
          }
        />
        <NavCard
          href="/contribute"
          icon="🛠️"
          title="CONTRIBUTE"
          description="Help build breacher.net — code, content, or ideas"
        />
      </div>

      {/* ── MARATHON — Game Content ── */}
      <h2 className="section-title">MARATHON</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <NavCard
          href="/marathon"
          icon="📊"
          title="METRICS"
          description="Kill counts, player data, analytics, and 500M ETA projection"
          accent="danger"
        />
        <ExternalCard
          href={URLS.weaponsDb}
          icon="🔫"
          title="WEAPONS DATABASE"
          description="Community weapon and mod tracker with loadout info"
        />
        <ComingSoonCard
          title="INTERACTIVE MAPS"
          description="Collaborative raid maps with callouts and routes"
        />
        <ComingSoonCard
          title="RAID GUIDES"
          description="Community-written strategy guides for Marathon raids"
        />
      </div>

      {/* ── CRYOARCHIVE — ARG Achievement ── */}
      <h2 className="section-title">CRYOARCHIVE</h2>
      <div className="mb-12">
        <Link
          href="/cryoarchive"
          className="cryo-panel p-6 flex items-center gap-5 hover:border-accent/30 transition-colors no-underline group block"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent2 via-accent to-transparent" />
          <div className="text-3xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" aria-hidden="true">
            📡
          </div>
          <div className="flex-1">
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
              CRYOARCHIVE DASHBOARD
            </div>
            <div className="text-sm text-dim">
              Sector states, cameras, maps, index archive, and site changes
              — the community&apos;s complete ARG tracking archive
            </div>
          </div>
          <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform shrink-0">
            →
          </div>
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer
        className="border-t border-border pt-6 text-center text-xs text-dim tracking-[2px]"
        role="contentinfo"
      >
        <p>
          BUILT BY{" "}
          <a
            href={URLS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:glow-accent"
          >
            BREACHERS OF TOMORROW
          </a>
        </p>
        <p className="mt-2">
          ORIGINAL TRACKER BY{" "}
          <a
            href={URLS.crowdTypical}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:glow-accent"
          >
            CROWDTYPICAL
          </a>
        </p>
        <p className="mt-2">
          HISTORICAL DATA BY{" "}
          <a
            href={URLS.winnower}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:glow-accent"
          >
            WINNOWER GARDEN
          </a>
        </p>
        <p className="mt-2 text-dim/50">NOT AFFILIATED WITH BUNGIE</p>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Card components                                                    */
/* ------------------------------------------------------------------ */

function NavCard({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  accent?: "danger" | "mint" | "accent2";
}) {
  const titleColor =
    accent === "danger"
      ? "text-danger group-hover:glow-danger"
      : accent === "mint"
        ? "text-mint group-hover:glow-mint"
        : accent === "accent2"
          ? "text-accent2 group-hover:glow-accent2"
          : "text-accent group-hover:glow-accent";

  return (
    <Link
      href={href}
      className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
    >
      <div
        className="text-3xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1">
        <div
          className={`font-[var(--font-display)] text-xs tracking-[3px] ${titleColor} mb-1`}
        >
          {title}
        </div>
        <div className="text-sm text-dim">{description}</div>
      </div>
      <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform shrink-0">
        →
      </div>
    </Link>
  );
}

function ExternalCard({
  href,
  icon,
  customIcon,
  title,
  description,
}: {
  href: string;
  icon?: string;
  customIcon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
    >
      {customIcon ? (
        <div className="shrink-0" aria-hidden="true">
          {customIcon}
        </div>
      ) : (
        <div
          className="text-3xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
          {title}
        </div>
        <div className="text-sm text-dim">{description}</div>
      </div>
      <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform shrink-0">
        ↗
      </div>
    </a>
  );
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="cryo-panel p-6 flex items-center gap-4 opacity-60 border-dashed">
      <div
        className="text-2xl shrink-0 grayscale opacity-50"
        aria-hidden="true"
      >
        🚧
      </div>
      <div className="flex-1">
        <div className="font-[var(--font-display)] text-xs tracking-[3px] text-dim mb-1 flex items-center gap-2">
          {title}
          <span className="font-[var(--font-display)] text-[0.5rem] tracking-[2px] px-2 py-0.5 border border-border text-dim/60">
            COMING SOON
          </span>
        </div>
        <div className="text-sm text-dim/70">{description}</div>
      </div>
    </div>
  );
}
