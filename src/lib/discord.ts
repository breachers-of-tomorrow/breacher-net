// ============================================================
// Discord invite API — fetches approximate member / presence
// counts using the public invite endpoint (no auth required).
//
// Used by the status ticker and homepage hero strip.
// ============================================================

const DISCORD_INVITE_CODE = "sGeg5Gx2yM";

interface DiscordInviteResponse {
    guild?: {
        id: string;
        name: string;
    };
    approximate_member_count?: number;
    approximate_presence_count?: number;
}

export interface DiscordPresence {
    /** Total server members */
    members: number;
    /** Currently online (green/idle/dnd) */
    online: number;
}

/**
 * Fetch approximate member and presence counts from the Discord
 * invite API.  This is a public, no-auth endpoint — rate limits
 * are generous but we cache via Next.js revalidation.
 *
 * Returns null on any failure (non-critical data).
 */
export async function fetchDiscordPresence(): Promise<DiscordPresence | null> {
    try {
        const res = await fetch(
            `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
            { next: { revalidate: 300 } },
        );
        if (!res.ok) return null;
        const data = (await res.json()) as DiscordInviteResponse;
        if (!data.approximate_member_count) return null;
        return {
            members: data.approximate_member_count,
            online: data.approximate_presence_count ?? 0,
        };
    } catch {
        return null;
    }
}
