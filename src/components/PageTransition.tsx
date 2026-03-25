"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps page content and triggers a brief visual glitch on route changes.
 *
 * - 150ms CSS animation (page-glitch in globals.css)
 * - Disabled under prefers-reduced-motion (handled by CSS)
 * - No layout shift — only opacity + micro-translate
 * - Uses ref + classList to avoid setState-in-effect lint violations
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("page-glitch");
    const timeout = setTimeout(() => el.classList.remove("page-glitch"), 150);
    return () => {
      clearTimeout(timeout);
      el.classList.remove("page-glitch");
    };
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
