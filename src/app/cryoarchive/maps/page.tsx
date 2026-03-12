import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRYOARCHIVE // TERMINAL MAPS",
};

export default function MapsPage() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8">
      <div className="section-title">TERMINAL MAPS</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MapCard
          name="PERIMETER"
          description="Outer defense ring and entry zones"
          status="COMING SOON"
        />
        <MapCard
          name="DIRE MARSH"
          description="Wetland sectors: AI Uplink, Algae Ponds, Bio Research, Canal, Complex, Westgate"
          status="COMING SOON"
        />
        <MapCard
          name="OUTPOST"
          description="Forward operating routes 1-3"
          status="COMING SOON"
        />
      </div>

      <div className="cryo-panel p-8 text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <div className="font-[var(--font-display)] text-sm tracking-[3px] text-accent glow-accent mb-3">
          INTERACTIVE MAPS IN DEVELOPMENT
        </div>
        <div className="text-sm text-dim max-w-lg mx-auto leading-relaxed">
          The full interactive SVG maps from the original tracker are being
          ported to React components with zone interaction, stabilization data
          overlays, and image lightbox functionality.
        </div>
        <div className="mt-6">
          <a
            href="https://github.com/breachers-of-tomorrow/breacher-net/issues/9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:glow-accent tracking-[2px]"
          >
            TRACK PROGRESS ON GITHUB →
          </a>
        </div>
      </div>
    </main>
  );
}

function MapCard({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: string;
}) {
  return (
    <div className="cryo-panel p-6">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-transparent" />
      <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent mb-2">
        {name}
      </div>
      <div className="text-sm text-dim mb-3">{description}</div>
      <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim/50">
        {status}
      </div>
    </div>
  );
}
