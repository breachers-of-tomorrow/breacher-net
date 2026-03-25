"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Optional first-visit boot sequence overlay for breacher.net.
 *
 * - Plays once per browser session (sessionStorage flag)
 * - Completely skipped under prefers-reduced-motion
 * - Skip button always visible, ESC key also skips
 * - Screen readers get a plain aria-live announcement instead
 * - Real page content loads underneath (SSR unaffected)
 */

interface BootLine {
  text: string;
  style?: "system" | "ok" | "warn" | "accent" | "accent2" | "bright";
  delay?: number;
}

const BOOT_LINES: BootLine[] = [
  { text: "", delay: 300 },
  { text: "BREACHER//NET v2.1.0 // THE BREACHER NETWORK", style: "accent", delay: 200 },
  { text: "", delay: 400 },
  { text: "Initializing uplink .......................... ", delay: 80 },
  { text: "[ OK ]", style: "ok", delay: 600 },
  { text: "Connecting to Tau Ceti relay ................. ", delay: 80 },
  { text: "[ OK ]", style: "ok", delay: 500 },
  { text: "Synchronizing runner manifest ................ ", delay: 80 },
  { text: "[ OK ]", style: "ok", delay: 400 },
  { text: "Verifying data feed integrity ................ ", delay: 80 },
  { text: "[ OK ]", style: "ok", delay: 300 },
  { text: "", delay: 200 },
  { text: "Data feed:       ONLINE", style: "system", delay: 60 },
  { text: "Runners indexed: 1,602", style: "system", delay: 60 },
  { text: "Relay latency:   42ms", style: "system", delay: 60 },
  { text: "", delay: 300 },
  { text: "WARNING: Unsanctioned access detected. Proceed with caution.", style: "warn", delay: 500 },
  { text: "", delay: 300 },
  { text: "> WELCOME, BREACHER.", style: "bright", delay: 600 },
  { text: "", delay: 800 },
];

const SESSION_KEY = "breacher-net-boot-seen";

export default function BootOverlay() {
  const [shouldShow, setShouldShow] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine on mount whether to show
  useEffect(() => {
    // Skip for reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Skip if already seen this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    setShouldShow(true);
    // Mark as seen
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  // Auto-focus skip button
  useEffect(() => {
    if (shouldShow) skipBtnRef.current?.focus();
  }, [shouldShow]);

  // Animate lines
  useEffect(() => {
    if (!shouldShow || fadingOut || hidden) return;

    if (visibleLines >= BOOT_LINES.length) {
      // All lines shown — fade out
      const timer = setTimeout(() => setFadingOut(true), 200);
      return () => clearTimeout(timer);
    }

    const delay = BOOT_LINES[visibleLines]?.delay ?? 100;
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [shouldShow, visibleLines, fadingOut, hidden]);

  // After fade-out animation, remove from DOM
  useEffect(() => {
    if (!fadingOut) return;
    const timer = setTimeout(() => setHidden(true), 500);
    return () => clearTimeout(timer);
  }, [fadingOut]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const skip = useCallback(() => {
    setFadingOut(true);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!shouldShow || hidden) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shouldShow, hidden, skip]);

  if (!shouldShow || hidden) return null;

  function lineClass(style?: BootLine["style"]): string {
    switch (style) {
      case "ok": return "text-mint";
      case "warn": return "text-warn";
      case "accent": return "text-accent glow-accent";
      case "accent2": return "text-accent2";
      case "bright": return "text-text-heading font-bold";
      case "system": return "text-dim";
      default: return "text-foreground";
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-bg flex flex-col transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      role="status"
    >
      {/* Screen reader alternative */}
      <div className="sr-only" aria-live="assertive">
        Loading BREACHER.NET
      </div>

      {/* Skip button */}
      <div className="fixed top-4 right-4 z-[10000]">
        <button
          ref={skipBtnRef}
          onClick={skip}
          className="px-4 py-2 text-xs tracking-[2px] font-[var(--font-mono)] border border-border text-dim hover:text-accent hover:border-accent bg-bg/80 backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
        >
          SKIP [ESC]
        </button>
      </div>

      {/* Boot output */}
      <div
        ref={containerRef}
        className="flex-1 p-6 sm:p-12 font-[var(--font-mono)] text-xs sm:text-sm leading-relaxed overflow-y-auto"
        aria-hidden="true"
      >
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={lineClass(line.style)}>
            {line.text || "\u00A0"}
          </div>
        ))}

        {/* Blinking cursor */}
        {visibleLines < BOOT_LINES.length && (
          <span className="cursor-blink text-mint">▊</span>
        )}
      </div>
    </div>
  );
}
