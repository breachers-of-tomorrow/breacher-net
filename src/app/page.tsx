import Link from "next/link";
import { fetchState, fetchStabilization } from "@/lib/api";
import { SECTOR_NAMES } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const [state, stabilization] = await Promise.all([
    fetchState(),
    fetchStabilization(),
  ]);

  const killCount = state?.uescKillCount ?? null;
  const sectorsUnlocked = state
    ? SECTOR_NAMES.filter((s) => state.pages[s]?.unlocked).length
    : null;
  const sectorsCompleted = state
    ? SECTOR_NAMES.filter((s) => state.pages[s]?.completed).length
    : null;
  const totalSectors = SECTOR_NAMES.length;

  const avgStabilization = stabilization
    ? Math.round(
      Object.values(stabilization).reduce(
        (sum, c) => sum + c.stabilizationLevel,
        0
      ) / Object.values(stabilization).length
    )
    : null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="font-[var(--font-display)] text-3xl sm:text-5xl font-black text-accent glow-accent tracking-[6px] mb-4">
          BREACHER<span className="text-accent2">{"//"}</span>NET
        </h1>
        <p className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-text-heading tracking-[4px] mb-2">
          BREACHERS OF TOMORROW
        </p>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          COMMUNITY HUB &amp; LIVE TRACKER FOR THE MARATHON ARG
        </p>
      </div>

      {/* Quick Status */}
      {state && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="cryo-panel p-6 text-center">
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
              UESC KILL COUNT
            </div>
            <div className="font-[var(--font-display)] text-2xl font-black text-danger glow-danger">
              {killCount?.toLocaleString()}
            </div>
          </div>

          <div className="cryo-panel p-6 text-center">
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
              SECTORS
            </div>
            <div className="font-[var(--font-display)] text-2xl font-bold text-accent glow-accent">
              {sectorsCompleted}/{totalSectors}
              <span className="text-dim text-sm ml-2">COMPLETED</span>
            </div>
            <div className="text-xs text-dim mt-1">
              {sectorsUnlocked}/{totalSectors} unlocked
            </div>
          </div>

          <div className="cryo-panel p-6 text-center">
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
              AVG STABILIZATION
            </div>
            <div className="font-[var(--font-display)] text-2xl font-bold text-accent2 glow-accent2">
              {avgStabilization !== null ? `${avgStabilization}%` : "--"}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="section-title">CRYOARCHIVE TOOLS</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <NavCard
          href="/cryoarchive"
          icon="📡"
          title="DASHBOARD"
          description="Live kill count, sector states, ship date countdown, and kill rate chart"
        />
        <NavCard
          href="/cryoarchive/cameras"
          icon="📷"
          title="CAMERAS"
          description="CCTV stabilization levels across all sectors and cameras"
        />
        <NavCard
          href="/cryoarchive/maps"
          icon="🗺️"
          title="MAPS"
          description="Interactive maps of Perimeter, Dire Marsh, and Outpost"
        />
        <NavCard
          href="/cryoarchive/index"
          icon="📂"
          title="INDEX ARCHIVE"
          description="Cryoarchive entry index — types, lock status, and unlock tracking"
        />
        <NavCard
          href="/cryoarchive/changes"
          icon="🔄"
          title="SITE CHANGES"
          description="Detected website deployments and build changes"
        />
      </div>

      {/* Community Links */}
      <div className="section-title">COMMUNITY</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <a
          href="https://wiki.breacher.net"
          target="_blank"
          rel="noopener noreferrer"
          className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
        >
          <div className="text-3xl">📖</div>
          <div>
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
              WIKI
            </div>
            <div className="text-sm text-dim">
              Marathon lore, sectors, characters, and resources
            </div>
          </div>
          <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
        <a
          href="https://discord.gg/sGeg5Gx2yM"
          target="_blank"
          rel="noopener noreferrer"
          className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
        >
          <div className="text-3xl">💬</div>
          <div>
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
              DISCORD
            </div>
            <div className="text-sm text-dim">
              Join the Breachers of Tomorrow community
            </div>
          </div>
          <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
        <a
          href="https://docs.google.com/document/d/1mtUtDPvbh6ahiynYFVS7Z4O79Nw6y5PEOjweCpzWV_A/edit?tab=t.0"
          target="_blank"
          rel="noopener noreferrer"
          className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
        >
          <div className="text-3xl">📋</div>
          <div>
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
              COMMUNITY DOC
            </div>
            <div className="text-sm text-dim">
              Current objectives and Breach Protocol notes
            </div>
          </div>
          <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
        <a
          href="https://marathon.winnower.garden/cryoarchive"
          target="_blank"
          rel="noopener noreferrer"
          className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
        >
          <div className="text-3xl">🌱</div>
          <div>
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
              WINNOWER GARDEN
            </div>
            <div className="text-sm text-dim">
              Historical ARG data archive — full history from day one
            </div>
          </div>
          <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
      </div>

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-dim tracking-[2px]">
        <p>
          BUILT BY{" "}
          <a
            href="https://github.com/breachers-of-tomorrow"
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
            href="https://github.com/CrowdTypical"
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
            href="https://marathon.winnower.garden/cryoarchive"
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

function NavCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="cryo-panel p-6 flex items-center gap-4 hover:border-accent transition-colors no-underline group"
    >
      <div className="text-3xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent group-hover:glow-accent mb-1">
          {title}
        </div>
        <div className="text-sm text-dim">{description}</div>
      </div>
      <div className="ml-auto text-accent2 font-[var(--font-display)] text-lg group-hover:translate-x-1 transition-transform">
        →
      </div>
    </Link>
  );
}
