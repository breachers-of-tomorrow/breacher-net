"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/cryoarchive", label: "Dashboard" },
  { href: "/cryoarchive/cameras", label: "Camera Monitoring" },
  { href: "/cryoarchive/maps", label: "Terminal Maps" },
  { href: "/cryoarchive/changes", label: "Cryoarchive Changes" },
  {
    href: "https://docs.google.com/document/d/1mtUtDPvbh6ahiynYFVS7Z4O79Nw6y5PEOjweCpzWV_A/edit?tab=t.0",
    label: "Google Doc",
    external: true,
  },
  {
    href: "https://discord.gg/sGeg5Gx2yM",
    label: "Discord",
    external: true,
  },
  {
    href: "https://wiki.breacher.net",
    label: "Wiki",
    external: true,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-8 py-5 flex justify-between items-center bg-gradient-to-r from-accent/5 to-transparent flex-wrap gap-2.5">
        <Link href="/" className="no-underline">
          <div className="font-[var(--font-display)] text-lg sm:text-xl font-black text-accent glow-accent tracking-[4px]">
            BREACHER<span className="text-accent2">.NET</span>
          </div>
        </Link>
        <div className="flex gap-5 items-center text-xs flex-wrap">
          <StatusDot />
          <Clock />
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="bg-background border-b-2 border-border px-4 sm:px-8 pt-2.5 hidden md:flex gap-1.5">
        {NAV_LINKS.map((link) => {
          const isActive =
            !link.external && pathname === link.href;
          const baseClasses =
            "font-[var(--font-display)] text-[0.65rem] tracking-[3px] uppercase text-dim no-underline px-4 py-2.5 border border-transparent border-b-0 transition-all flex items-center gap-2 relative top-[2px]";
          const activeClasses = isActive
            ? "text-accent bg-panel border-border border-b-2 border-b-panel glow-accent"
            : "hover:text-foreground hover:bg-accent/5 hover:border-border";

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClasses} ${activeClasses}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                {link.label}
              </a>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${baseClasses} ${activeClasses}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden bg-background border-b border-border px-4 py-2 flex justify-end">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-dim hover:text-accent transition-colors p-2"
          aria-label="Toggle navigation"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-panel border-b border-border">
          {NAV_LINKS.map((link) => {
            const isActive = !link.external && pathname === link.href;
            if (link.external) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-3 text-xs tracking-[2px] uppercase text-dim hover:text-accent hover:bg-accent/5 border-b border-border/50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-6 py-3 text-xs tracking-[2px] uppercase border-b border-border/50 ${
                  isActive
                    ? "text-accent bg-accent/5"
                    : "text-dim hover:text-accent hover:bg-accent/5"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatusDot() {
  return (
    <div className="w-2 h-2 rounded-full bg-accent2 box-glow-accent2 animate-pulse-slow" />
  );
}

function Clock() {
  // Client-rendered clock
  return <ClientClock />;
}

function ClientClock() {
  const [time, setTime] = useState("");
  const [utc, setUtc] = useState("");

  // Only run on client
  if (typeof window !== "undefined" && !time) {
    const tick = () => {
      const now = new Date();
      const tz = (() => {
        try {
          const parts = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "short",
          }).formatToParts(now);
          return parts.find((p) => p.type === "timeZoneName")?.value || "";
        } catch {
          return "";
        }
      })();
      setTime(
        now.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) +
          " " +
          tz
      );
      setUtc(
        now.toLocaleString("en-US", {
          timeZone: "UTC",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " UTC"
      );
    };
    tick();
    setInterval(tick, 1000);
  }

  return (
    <>
      <span className="text-accent">{time || "--:--:--"}</span>
      <span className="text-dim text-[0.7rem] ml-1.5">{utc}</span>
    </>
  );
}
