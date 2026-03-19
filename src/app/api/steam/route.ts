import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";

const MARATHON_STEAM_APP_ID = 3065800;

interface SteamResponse {
  response: {
    player_count: number;
    result: number;
  };
}

/**
 * GET /api/steam
 *
 * Returns the current Steam player count for Marathon.
 * No API key required — uses the public ISteamUserStats endpoint.
 */
export async function GET() {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${MARATHON_STEAM_APP_ID}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) {
      return withCache(
        NextResponse.json(
          { error: "Steam API unavailable", playerCount: null },
          { status: 502 },
        ),
        "none",
      );
    }

    const data = (await res.json()) as SteamResponse;

    if (data.response?.result !== 1) {
      return withCache(
        NextResponse.json(
          { error: "Invalid Steam API response", playerCount: null },
          { status: 502 },
        ),
        "none",
      );
    }

    return withCache(
      NextResponse.json({
        playerCount: data.response.player_count,
        appId: MARATHON_STEAM_APP_ID,
        timestamp: new Date().toISOString(),
      }),
      "standard",
    );
  } catch {
    return withCache(
      NextResponse.json(
        { error: "Failed to fetch Steam data", playerCount: null },
        { status: 502 },
      ),
      "none",
    );
  }
}
