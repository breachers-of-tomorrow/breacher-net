// ============================================================
// /api/state/live — Server-side proxy for cryoarchive state API
//
// The cryoarchive.systems API doesn't include CORS headers, so
// client-side fetch() from the browser is blocked. This route
// proxies the request server-side where CORS doesn't apply.
// ============================================================

import { NextResponse } from "next/server";

const STATE_API = "https://cryoarchive.systems/api/public/state";

export async function GET() {
  try {
    const res = await fetch(`${STATE_API}?t=${Date.now()}`, {
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
