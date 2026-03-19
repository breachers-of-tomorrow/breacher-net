"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { URLS } from "@/lib/urls";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

interface NavSection {
  label: string;
  links: NavLink[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "CRYOARCHIVE",
    links: [
      { href: "/cryoarchive", label: "Dashboard" },
      { href: "/cryoarchive/cameras", label: "Cameras" },
      { href: "/cryoarchive/maps", label: "Maps" },
      { href: "/cryoarchive/index", label: "Index" },
      { href: "/cryoarchive/changes", label: "Changes" },
    ],
  },
  {
    label: "BREACHER.NET",
    links: [
      { href: "/about", label: "About" },
      { href: "/community", label: "Community" },
      { href: "/contribute", label: "Contribute" },
      { href: "/api-docs", label: "API Docs" },
      { href: "/status", label: "Status" },
      { href: URLS.wiki, label: "Wiki", external: true },
      { href: URLS.discord, label: "Discord", external: true },
      {
        href: URLS.communityDoc,
        label: "Community Doc",
        external: true,
      },
    ],
  },
  {
    label: "MARATHON",
    links: [
      { href: URLS.winnower, label: "Winnower", external: true },
      { href: URLS.tauCeti, label: "Tau Ceti", external: true },
    ],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-8 py-5 flex justify-between items-center bg-gradient-to-r from-accent/5 to-transparent flex-wrap gap-2.5" role="banner">
        <div className="flex items-center gap-4">
          <Link href="/" className="no-underline">
            <div className="font-[var(--font-display)] text-lg sm:text-xl font-black text-accent glow-accent tracking-[4px]">
              BREACHER<span className="text-accent2">{"//"}</span>NET
            </div>
          </Link>
        </div>
        <div className="flex gap-5 items-center text-xs flex-wrap">
          <StatusDot />
          <Clock />
        </div>
      </header>

      {/* Desktop nav */}
      <nav aria-label="Main navigation" className="bg-background border-b-2 border-border px-4 sm:px-8 pt-2.5 hidden md:flex items-end gap-0 overflow-x-auto scrollbar-none">
        {/* Home tab */}
        <Link
          href="/"
          className={`font-[var(--font-display)] text-[0.65rem] tracking-[3px] uppercase no-underline px-3 py-2.5 border border-transparent border-b-0 transition-all flex items-center gap-1.5 relative top-[2px] mr-2 ${pathname === "/"
            ? "text-accent bg-panel border-border border-b-2 border-b-panel glow-accent"
            : "text-dim hover:text-foreground hover:bg-accent/5 hover:border-border"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
          </svg>
          HOME
        </Link>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex items-end">
            {/* Section divider */}
            <div className="h-5 w-px bg-border mx-1.5 mb-2.5" />
            {/* Section label */}
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim px-1.5 pb-3 select-none">
              {section.label}
            </div>
            {/* Section links */}
            {section.links.map((link) => {
              const isActive = !link.external && pathname === link.href;
              const baseClasses =
                "font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase text-dim no-underline px-2.5 py-2.5 border border-transparent border-b-0 transition-all flex items-center gap-1.5 relative top-[2px]";
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
                    {link.label}
                    <svg className="w-2.5 h-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden bg-background border-b border-border px-4 py-2 flex justify-end">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-dim hover:text-accent transition-colors p-2"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
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
        <nav id="mobile-nav-menu" aria-label="Mobile navigation" className="md:hidden bg-panel border-b border-border">
          {/* Home link */}
          <Link
            href="/"
            className={`block px-6 py-3 text-xs tracking-[2px] uppercase border-b border-border/50 ${pathname === "/"
              ? "text-accent bg-accent/5"
              : "text-dim hover:text-accent hover:bg-accent/5"
              }`}
            onClick={() => setMobileOpen(false)}
          >
            ⌂ Home
          </Link>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section header */}
              <div className="px-6 py-2 text-[0.6rem] tracking-[3px] uppercase text-dim bg-background/50 border-b border-border/30 font-[var(--font-display)]">
                {section.label}
              </div>
              {section.links.map((link) => {
                const isActive = !link.external && pathname === link.href;
                if (link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-8 py-3 text-xs tracking-[2px] uppercase text-dim hover:text-accent hover:bg-accent/5 border-b border-border/50"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label} ↗
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-8 py-3 text-xs tracking-[2px] uppercase border-b border-border/50 ${isActive
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
          ))}
        </nav>
      )}
    </>
  );
}

function StatusDot() {
  return (
    <div role="status" aria-label="System online" className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-mint box-glow-mint animate-pulse-slow" aria-hidden="true" />
      <span className="sr-only">System is online</span>
    </div>
  );
}

function Clock() {
  return <ClientClock />;
}

function ClientClock() {
  const [time, setTime] = useState("--:--:--");
  const [utc, setUtc] = useState("");

  useEffect(() => {
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
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <span className="text-accent">{time}</span>
      <span className="text-dim text-[0.7rem] ml-1.5">{utc}</span>
    </>
  );
}
