// ============================================================
// /api/stabilization/live — Server-side proxy for cryoarchive
// stabilization API (CORS bypass for client-side refresh)
// ============================================================

import { NextResponse } from "next/server";

const STABILIZATION_API =
  "https://cryoarchive.systems/api/public/cctv-cameras/stabilization";

export async function GET() {
  try {
    const res = await fetch(`${STABILIZATION_API}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
