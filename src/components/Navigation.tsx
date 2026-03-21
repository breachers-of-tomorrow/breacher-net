"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { URLS } from "@/lib/urls";

/* ------------------------------------------------------------------ */
/*  Types & data                                                       */
/* ------------------------------------------------------------------ */

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

interface NavGroup {
  label: string;
  icon?: string;
  href?: string;
  links?: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "HOME",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z",
  },
  {
    label: "COMMUNITY",
    links: [
      { href: "/about", label: "About" },
      { href: "/community", label: "Resources" },
      { href: "/contribute", label: "Contribute" },
      { href: URLS.wiki, label: "Wiki", external: true },
      { href: URLS.discord, label: "Discord", external: true },
    ],
  },
  {
    label: "MARATHON",
    links: [
      { href: "/marathon", label: "Metrics" },
      { href: URLS.weaponsDb, label: "Weapons DB", external: true },
    ],
  },
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
    label: "RESOURCES",
    links: [
      { href: "/api-docs", label: "API Docs" },
      { href: "/status", label: "Status" },
      { href: URLS.communityDoc, label: "Community Doc", external: true },
      { href: URLS.winnower, label: "Winnower", external: true },
      { href: URLS.tauCeti, label: "Tau Ceti", external: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Shared icons                                                       */
/* ------------------------------------------------------------------ */

function ExternalIcon({ className = "w-2.5 h-2.5 opacity-40" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-2.5 h-2.5 opacity-40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.href) return pathname === group.href;
  return group.links?.some((l) => !l.external && pathname === l.href) ?? false;
}

/* ------------------------------------------------------------------ */
/*  Desktop dropdown                                                   */
/* ------------------------------------------------------------------ */

function DesktopDropdown({
  group,
  pathname,
  openGroup,
  setOpenGroup,
}: {
  group: NavGroup;
  pathname: string;
  openGroup: string | null;
  setOpenGroup: (g: string | null) => void;
}) {
  const isOpen = openGroup === group.label;
  const active = isGroupActive(group, pathname);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const open = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(group.label);
  }, [group.label, setOpenGroup]);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenGroup(null), 150);
  }, [setOpenGroup]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroup(null);
        (e.currentTarget as HTMLElement).focus();
      }
      if (e.key === "ArrowDown" && !isOpen) {
        e.preventDefault();
        open();
      }
    },
    [isOpen, open, setOpenGroup],
  );

  const tabClasses = `font-[var(--font-display)] text-[0.65rem] tracking-[3px] uppercase no-underline px-3 py-2.5 border border-transparent border-b-0 transition-all flex items-center gap-1.5 relative top-[2px] cursor-pointer select-none ${
    active
      ? "text-accent bg-panel border-border border-b-2 border-b-panel glow-accent"
      : "text-dim hover:text-foreground hover:bg-accent/5 hover:border-border"
  }`;

  return (
    <div
      className="relative"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        className={tabClasses}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setOpenGroup(null) : open())}
      >
        {group.label}
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && group.links && (
        <div
          className="absolute top-full left-0 mt-[2px] min-w-[180px] bg-panel border border-border shadow-lg z-50"
          role="menu"
        >
          {group.links.map((link) => {
            const linkActive = !link.external && pathname === link.href;
            const cls = `block w-full text-left px-4 py-2.5 font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase no-underline transition-colors flex items-center gap-2 ${
              linkActive
                ? "text-accent bg-accent/10"
                : "text-dim hover:text-foreground hover:bg-accent/5"
            }`;

            if (link.external) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                  role="menuitem"
                  onClick={() => setOpenGroup(null)}
                >
                  {link.label}
                  <ExternalIcon />
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cls}
                role="menuitem"
                onClick={() => setOpenGroup(null)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!openGroup) return;
    const handler = (e: MouseEvent) => {
      const nav = document.getElementById("desktop-nav");
      if (nav && !nav.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openGroup]);

  return (
    <>
      {/* Header */}
      <header
        className="border-b border-border px-4 sm:px-8 py-5 flex justify-between items-center bg-gradient-to-r from-accent/5 to-transparent flex-wrap gap-2.5"
        role="banner"
      >
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
      <nav
        id="desktop-nav"
        aria-label="Main navigation"
        className="bg-background border-b-2 border-border px-4 sm:px-8 pt-2.5 hidden md:flex items-end gap-1"
      >
        {NAV_GROUPS.map((group) => {
          if (group.href) {
            const active = pathname === group.href;
            return (
              <Link
                key={group.label}
                href={group.href}
                className={`font-[var(--font-display)] text-[0.65rem] tracking-[3px] uppercase no-underline px-3 py-2.5 border border-transparent border-b-0 transition-all flex items-center gap-1.5 relative top-[2px] ${
                  active
                    ? "text-accent bg-panel border-border border-b-2 border-b-panel glow-accent"
                    : "text-dim hover:text-foreground hover:bg-accent/5 hover:border-border"
                }`}
              >
                {group.icon && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={group.icon} />
                  </svg>
                )}
                {group.label}
              </Link>
            );
          }

          return (
            <DesktopDropdown
              key={group.label}
              group={group}
              pathname={pathname}
              openGroup={openGroup}
              setOpenGroup={setOpenGroup}
            />
          );
        })}
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
          {NAV_GROUPS.map((group) => {
            if (group.href) {
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={`block px-6 py-3 text-xs tracking-[2px] uppercase border-b border-border/50 ${
                    pathname === group.href
                      ? "text-accent bg-accent/5"
                      : "text-dim hover:text-accent hover:bg-accent/5"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  ⌂ {group.label}
                </Link>
              );
            }

            return (
              <div key={group.label}>
                <div className="px-6 py-2 text-[0.6rem] tracking-[3px] uppercase text-dim bg-background/50 border-b border-border/30 font-[var(--font-display)]">
                  {group.label}
                </div>
                {group.links?.map((link) => {
                  const linkActive = !link.external && pathname === link.href;
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
                      className={`block px-8 py-3 text-xs tracking-[2px] uppercase border-b border-border/50 ${
                        linkActive
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
            );
          })}
        </nav>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Header widgets                                                     */
/* ------------------------------------------------------------------ */

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
          tz,
      );
      setUtc(
        now.toLocaleString("en-US", {
          timeZone: "UTC",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " UTC",
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
