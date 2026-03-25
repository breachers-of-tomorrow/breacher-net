"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Wraps page content and triggers a brief visual glitch on route changes.
 *
 * - 150ms CSS animation (page-glitch in globals.css)
 * - Disabled under prefers-reduced-motion (handled by CSS)
 * - No layout shift — only opacity + micro-translate
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    setGlitching(true);
    const timeout = setTimeout(() => setGlitching(false), 150);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className={glitching ? "page-glitch" : undefined}>{children}</div>
  );
}
