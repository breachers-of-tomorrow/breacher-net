"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// ============================================================
// Data types
// ============================================================

interface CameraData {
  stabilizationLevel: number;
  nextStabilizationAt: string | null;
}

type CameraMap = Record<string, CameraData>;

interface ZoneCircle {
  cx: number;
  cy: number;
  r: number;
}

interface ZoneImage {
  src: string;
  alt: string;
  label: string;
}

interface ZoneImageGroup {
  sectionLabel: string;
  description?: string;
  images: ZoneImage[];
}

interface ZoneInfo {
  label: string;
  color: string;
  title: string;
  imageGroups: ZoneImageGroup[];
}

interface MapConfig {
  id: string;
  displayName: string;
  mapImage: string;
  viewBox: string;
  cameras: string[];
  zones: Record<string, { circles: ZoneCircle[]; color: string }>;
  zoneInfo: Record<string, ZoneInfo>;
}

// ============================================================
// Map configurations — ported from upstream terminal_maps.html
// ============================================================

const MAPS: MapConfig[] = [
  {
    id: "perimeter",
    displayName: "Perimeter",
    mapImage: "/maps/Marathon_Terminal_Map.jpg",
    viewBox: "0 0 1100 1100",
    cameras: ["cargo", "index", "cryoHub"],
    zones: {
      "1": {
        circles: [
          { cx: 200, cy: 108, r: 78 },
          { cx: 128, cy: 928, r: 82 },
        ],
        color: "#00E5CC",
      },
      "2": {
        circles: [
          { cx: 425, cy: 525, r: 78 },
          { cx: 862, cy: 892, r: 82 },
        ],
        color: "#39FF14",
      },
      "3": {
        circles: [
          { cx: 158, cy: 558, r: 78 },
          { cx: 893, cy: 458, r: 82 },
        ],
        color: "#FFAA00",
      },
    },
    zoneInfo: {
      "1": {
        label: "// ZONE 01",
        color: "#00E5CC",
        title: "ROUTE ONE",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            images: [
              { src: "/maps/z1_start_1.png", alt: "Zone 1 Start Exterior", label: "ZONE 1 — START / EXTERIOR" },
              { src: "/maps/z1_start_2.png", alt: "Zone 1 Start Interior", label: "ZONE 1 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            images: [
              { src: "/maps/z1_end_1.png", alt: "Zone 1 End Exterior", label: "ZONE 1 — END / EXTERIOR" },
              { src: "/maps/z1_end_2.png", alt: "Zone 1 End Interior", label: "ZONE 1 — END / INTERIOR" },
            ],
          },
        ],
      },
      "2": {
        label: "// ZONE 02",
        color: "#39FF14",
        title: "ROUTE TWO",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            description: "In the main building, in the back room.",
            images: [
              { src: "/maps/z2_start_1.png", alt: "Zone 2 Start Exterior", label: "ZONE 2 — START / EXTERIOR" },
              { src: "/maps/z2_start_2.png", alt: "Zone 2 Start Interior", label: "ZONE 2 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            description: "Go up the stairs then to the right.",
            images: [
              { src: "/maps/z2_end_1.png", alt: "Zone 2 End Exterior", label: "ZONE 2 — END / EXTERIOR" },
              { src: "/maps/z2_end_2.png", alt: "Zone 2 End Interior", label: "ZONE 2 — END / INTERIOR" },
            ],
          },
        ],
      },
      "3": {
        label: "// ZONE 03",
        color: "#FFAA00",
        title: "ROUTE THREE",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            images: [
              { src: "/maps/z3_start_1.png", alt: "Zone 3 Start Exterior", label: "ZONE 3 — START / EXTERIOR" },
              { src: "/maps/z3_start_2.png", alt: "Zone 3 Start Interior", label: "ZONE 3 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            images: [
              { src: "/maps/z3_end_1.png", alt: "Zone 3 End Exterior", label: "ZONE 3 — END / EXTERIOR" },
              { src: "/maps/z3_end_2.png", alt: "Zone 3 End Interior", label: "ZONE 3 — END / INTERIOR" },
            ],
          },
        ],
      },
    },
  },
  {
    id: "dire-marsh",
    displayName: "Dire Marsh",
    mapImage: "/maps/Dire_Marsh_Map.jpg",
    viewBox: "0 0 1100 1060",
    cameras: ["biostock", "steerage", "camera09"],
    zones: {
      "dm-route1": {
        circles: [
          { cx: 120, cy: 472, r: 55 },
          { cx: 583, cy: 712, r: 55 },
        ],
        color: "#00E5CC",
      },
      "dm-route2": {
        circles: [
          { cx: 895, cy: 501, r: 55 },
          { cx: 428, cy: 723, r: 55 },
        ],
        color: "#FFAA00",
      },
      "dm-route3": {
        circles: [
          { cx: 418, cy: 597, r: 55 },
          { cx: 706, cy: 347, r: 55 },
        ],
        color: "#C084FC",
      },
    },
    zoneInfo: {
      "dm-route1": {
        label: "// ROUTE 01",
        color: "#00E5CC",
        title: "AI UPLINK → WEST GATE",
        imageGroups: [
          {
            sectionLabel: "// AI UPLINK (START)",
            images: [
              { src: "/maps/dm_aiuplink_1.png", alt: "AI Uplink Exterior", label: "AI UPLINK — EXTERIOR" },
              { src: "/maps/dm_aiuplink_2.png", alt: "AI Uplink Interior", label: "AI UPLINK — INTERIOR" },
            ],
          },
          {
            sectionLabel: "// WEST GATE (END)",
            images: [
              { src: "/maps/dm_westgate_1.png", alt: "West Gate Exterior", label: "WEST GATE — EXTERIOR" },
              { src: "/maps/dm_westgate_2.png", alt: "West Gate Interior", label: "WEST GATE — INTERIOR" },
            ],
          },
        ],
      },
      "dm-route2": {
        label: "// ROUTE 02",
        color: "#FFAA00",
        title: "COMPLEX → CANAL",
        imageGroups: [
          {
            sectionLabel: "// COMPLEX (START)",
            images: [
              { src: "/maps/dm_complex_1.png", alt: "Complex Exterior", label: "COMPLEX — EXTERIOR" },
              { src: "/maps/dm_complex_2.png", alt: "Complex Interior", label: "COMPLEX — INTERIOR" },
            ],
          },
          {
            sectionLabel: "// CANAL (END)",
            images: [
              { src: "/maps/dm_canal_1.png", alt: "Canal Exterior", label: "CANAL — EXTERIOR" },
              { src: "/maps/dm_canal_2.png", alt: "Canal Interior", label: "CANAL — INTERIOR" },
            ],
          },
        ],
      },
      "dm-route3": {
        label: "// ROUTE 03",
        color: "#C084FC",
        title: "ALGAE PONDS → BIO RESEARCH",
        imageGroups: [
          {
            sectionLabel: "// ALGAE PONDS (START)",
            images: [
              { src: "/maps/dm_algaeponds_1.png", alt: "Algae Ponds Exterior", label: "ALGAE PONDS — EXTERIOR" },
              { src: "/maps/dm_algaeponds_2.png", alt: "Algae Ponds Interior", label: "ALGAE PONDS — INTERIOR" },
            ],
          },
          {
            sectionLabel: "// BIO RESEARCH (END)",
            images: [
              { src: "/maps/dm_bioresearch_1.png", alt: "Bio Research Exterior", label: "BIO RESEARCH — EXTERIOR" },
              { src: "/maps/dm_bioresearch_2.png", alt: "Bio Research Interior", label: "BIO RESEARCH — INTERIOR" },
            ],
          },
        ],
      },
    },
  },
  {
    id: "outpost",
    displayName: "Outpost",
    mapImage: "/maps/Outpost.jpg",
    viewBox: "0 0 1100 1060",
    cameras: ["revival", "camera06", "preservation"],
    zones: {
      "op-route1": {
        circles: [
          { cx: 757, cy: 637, r: 55 },
          { cx: 269, cy: 637, r: 55 },
        ],
        color: "#00E5CC",
      },
      "op-route2": {
        circles: [
          { cx: 365, cy: 730, r: 55 },
          { cx: 449, cy: 171, r: 55 },
        ],
        color: "#FFAA00",
      },
      "op-route3": {
        circles: [
          { cx: 433, cy: 398, r: 55 },
          { cx: 558, cy: 506, r: 55 },
        ],
        color: "#C084FC",
      },
    },
    zoneInfo: {
      "op-route1": {
        label: "// ROUTE 01",
        color: "#00E5CC",
        title: "DORMITORIES → DRONE WING",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            images: [
              { src: "/maps/op_route1_start_exterior.png", alt: "Route 1 Start Exterior", label: "OUTPOST ROUTE 1 — START / EXTERIOR" },
              { src: "/maps/op_route1_start_interior.png", alt: "Route 1 Start Interior", label: "OUTPOST ROUTE 1 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            images: [
              { src: "/maps/op_route1_end_exterior.png", alt: "Route 1 End Exterior", label: "OUTPOST ROUTE 1 — END / EXTERIOR" },
              { src: "/maps/op_route1_end_interior.png", alt: "Route 1 End Interior", label: "OUTPOST ROUTE 1 — END / INTERIOR" },
            ],
          },
        ],
      },
      "op-route2": {
        label: "// ROUTE 02",
        color: "#FFAA00",
        title: "PROCESSING → AIRFIELD",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            images: [
              { src: "/maps/op_route2_start_exterior.png", alt: "Route 2 Start Exterior", label: "OUTPOST ROUTE 2 — START / EXTERIOR" },
              { src: "/maps/op_route2_start_interior.png", alt: "Route 2 Start Interior", label: "OUTPOST ROUTE 2 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            images: [
              { src: "/maps/op_route2_end_exterior.png", alt: "Route 2 End Exterior", label: "OUTPOST ROUTE 2 — END / EXTERIOR" },
              { src: "/maps/op_route2_end_interior.png", alt: "Route 2 End Interior", label: "OUTPOST ROUTE 2 — END / INTERIOR" },
            ],
          },
        ],
      },
      "op-route3": {
        label: "// ROUTE 03",
        color: "#C084FC",
        title: "FLIGHT CONTROL → DESTROYED WING",
        imageGroups: [
          {
            sectionLabel: "// START TERMINAL",
            images: [
              { src: "/maps/op_route3_start_exterior.png", alt: "Route 3 Start Exterior", label: "OUTPOST ROUTE 3 — START / EXTERIOR" },
              { src: "/maps/op_route3_start_interior.png", alt: "Route 3 Start Interior", label: "OUTPOST ROUTE 3 — START / INTERIOR" },
            ],
          },
          {
            sectionLabel: "// END TERMINAL",
            images: [
              { src: "/maps/op_route3_end_exterior.png", alt: "Route 3 End Exterior", label: "OUTPOST ROUTE 3 — END / EXTERIOR" },
              { src: "/maps/op_route3_end_interior.png", alt: "Route 3 End Interior", label: "OUTPOST ROUTE 3 — END / INTERIOR" },
            ],
          },
        ],
      },
    },
  },
];

// ============================================================
// Display helpers
// ============================================================

const CAMERA_DISPLAY: Record<string, string> = {
  cargo: "CARGO",
  index: "INDEX",
  cryoHub: "CRYOHUB",
  biostock: "BIOSTOCK",
  steerage: "STEERAGE",
  camera09: "CAMERA09",
  revival: "REVIVAL",
  camera06: "CAMERA06",
  preservation: "PRESERVATION",
};

function levelClass(level: number): string {
  if (level === 0) return "text-accent2 glow-accent2";
  if (level <= 25) return "text-accent glow-accent";
  if (level <= 50) return "text-warn";
  return "text-danger glow-danger";
}

function levelBorder(level: number): string {
  if (level === 0) return "border-accent2/30";
  if (level <= 25) return "border-accent/30";
  if (level <= 50) return "border-warn/30";
  return "border-danger/30";
}

// ============================================================
// Components
// ============================================================

/** Single camera stabilization card */
function CameraCard({ name, data }: { name: string; data?: CameraData }) {
  const level = data?.stabilizationLevel ?? null;
  const display = CAMERA_DISPLAY[name] ?? name.toUpperCase();

  return (
    <div className={`cryo-panel p-4 transition-colors ${level !== null ? levelBorder(level) : ""}`}>
      <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-1.5">
        {display}
      </div>
      <div className={`text-3xl font-bold leading-none mb-1 ${level !== null ? levelClass(level) : "text-dim"}`}>
        {level !== null ? level : "--"}
      </div>
      <div className="text-[0.65rem] text-dim">
        {data?.nextStabilizationAt
          ? `NEXT: ${new Date(data.nextStabilizationAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
          : level === 0
            ? "STABILIZED"
            : level === 100
              ? "FULLY DESTABILIZED"
              : "NEXT: --"}
      </div>
    </div>
  );
}

/** Alert banner showing completion status */
function AlertBanner({ mapName, allComplete }: { mapName: string; allComplete: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 p-3 text-center font-[var(--font-display)] text-xs tracking-[3px] border ${
        allComplete
          ? "border-accent2/25 bg-accent2/5 text-accent2"
          : "border-warn/25 bg-warn/5 text-warn"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          allComplete ? "bg-accent2 shadow-[0_0_6px_var(--color-accent2)] animate-pulse-slow" : "bg-warn shadow-[0_0_6px_var(--color-warn)]"
        }`}
      />
      {mapName.toUpperCase()} TERMINALS {allComplete ? "COMPLETE" : "INCOMPLETE"}
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          allComplete ? "bg-accent2 shadow-[0_0_6px_var(--color-accent2)] animate-pulse-slow" : "bg-warn shadow-[0_0_6px_var(--color-warn)]"
        }`}
      />
    </div>
  );
}

/** Image thumbnail that opens lightbox */
function ImageThumb({
  src,
  alt,
  label,
  onClick,
}: {
  src: string;
  alt: string;
  label: string;
  onClick: (src: string, label: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(src, label)}
      className="relative aspect-video overflow-hidden border border-border bg-[#020810] cursor-pointer transition-colors hover:border-accent group"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-opacity group-hover:opacity-85"
        sizes="(max-width: 640px) 100vw, 250px"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-[rgba(3,10,15,0.85)] text-[0.6rem] tracking-[2px] text-dim px-2 py-1">
        {alt.includes("Exterior") ? "EXTERIOR" : "INTERIOR"}
      </div>
    </button>
  );
}

/** Zone info panel content */
function ZoneInfoContent({
  info,
  onImageClick,
}: {
  info: ZoneInfo;
  onImageClick: (src: string, label: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      <div
        className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] mb-1.5"
        style={{ color: info.color }}
      >
        {info.label}
      </div>
      <div className="font-[var(--font-display)] text-xl font-black tracking-[4px] text-foreground mb-4">
        {info.title}
      </div>
      <div className="h-px bg-border mb-4" />
      {info.imageGroups.map((group, i) => (
        <div key={i} className={i > 0 ? "mt-4" : ""}>
          <div className="font-[var(--font-display)] text-[0.55rem] tracking-[3px] text-dim mb-2">
            {group.sectionLabel}
          </div>
          {group.description && (
            <div className="text-[0.72rem] text-dim/70 mb-2">{group.description}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {group.images.map((img) => (
              <ImageThumb
                key={img.src}
                src={img.src}
                alt={img.alt}
                label={img.label}
                onClick={onImageClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Interactive SVG overlay for a map */
function MapSVGOverlay({
  config,
  activeZone,
  hoveredZone,
  onHover,
  onLeave,
  onClick,
}: {
  config: MapConfig;
  activeZone: string | null;
  hoveredZone: string | null;
  onHover: (zone: string) => void;
  onLeave: (zone: string) => void;
  onClick: (zone: string) => void;
}) {
  return (
    <svg
      viewBox={config.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
    >
      {Object.entries(config.zones).map(([zoneId, zone]) =>
        zone.circles.map((circle, i) => {
          const isActive = activeZone === zoneId || hoveredZone === zoneId;
          return (
            <g
              key={`${zoneId}-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => onHover(zoneId)}
              onMouseLeave={() => onLeave(zoneId)}
              onClick={() => onClick(zoneId)}
            >
              {/* Hit area (invisible, larger) */}
              <circle cx={circle.cx} cy={circle.cy} r={circle.r + 15} fill="transparent" />
              {/* Fill glow */}
              <circle
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill={zone.color}
                opacity={isActive ? 0.18 : 0}
                className="transition-opacity duration-200"
              />
              {/* Ring */}
              <circle
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill="none"
                stroke={zone.color}
                strokeWidth={3}
                opacity={isActive ? 1 : 0}
                className="transition-opacity duration-200"
                style={isActive ? { filter: `drop-shadow(0 0 8px ${zone.color})` } : {}}
              />
            </g>
          );
        })
      )}
    </svg>
  );
}

/** Single map tab panel */
function MapPanel({
  config,
  cameras,
  onImageClick,
}: {
  config: MapConfig;
  cameras: CameraMap;
  onImageClick: (src: string, label: string) => void;
}) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const displayedZone = hoveredZone || activeZone;

  // Check if all cameras for this map are fully destabilized (level 100) or stabilized (level 0)
  const cameraLevels = config.cameras.map((c) => cameras[c]?.stabilizationLevel ?? null);
  const allComplete = cameraLevels.every((l) => l === 0 || l === 100);

  const handleHover = useCallback((zone: string) => setHoveredZone(zone), []);
  const handleLeave = useCallback(() => setHoveredZone(null), []);
  const handleClick = useCallback(
    (zone: string) => {
      setActiveZone((prev) => (prev === zone ? null : zone));
    },
    []
  );

  // Determine active zone border color for info panel
  const activeColor = displayedZone ? config.zones[displayedZone]?.color : null;

  return (
    <div>
      <AlertBanner mapName={config.displayName} allComplete={allComplete} />

      {/* Camera cards */}
      <div className="section-title mt-6">
        {config.displayName.toUpperCase()} {/* STABILIZATION LEVELS */}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {config.cameras.map((cam) => (
          <CameraCard key={cam} name={cam} data={cameras[cam]} />
        ))}
      </div>

      {/* Map + info panel */}
      <div className="section-title">
        {config.displayName.toUpperCase()} {/* TERMINAL MAP */}
      </div>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Map container */}
        <div className="relative w-full lg:max-w-[700px] border border-border bg-panel shrink-0">
          <Image
            src={config.mapImage}
            alt={`${config.displayName} Terminal Map`}
            width={1100}
            height={config.viewBox.endsWith("1100") ? 1100 : 1060}
            className="block w-full h-auto"
            priority
          />
          <MapSVGOverlay
            config={config}
            activeZone={activeZone}
            hoveredZone={hoveredZone}
            onHover={handleHover}
            onLeave={handleLeave}
            onClick={handleClick}
          />
        </div>

        {/* Info panel */}
        <div
          className="w-full lg:flex-1 cryo-panel p-6 min-h-[400px] relative overflow-hidden transition-all"
          style={
            activeColor
              ? { borderColor: `${activeColor}33` }
              : {}
          }
        >
          {/* Colored top bar */}
          {activeColor && (
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg, ${activeColor}, transparent)`,
              }}
            />
          )}

          {!displayedZone ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3">
              <div className="font-[var(--font-display)] text-3xl text-border tracking-[8px]">
                [ — ]
              </div>
              <div className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] text-dim">
                HOVER A ZONE TO INSPECT
              </div>
            </div>
          ) : (
            config.zoneInfo[displayedZone] && (
              <ZoneInfoContent
                info={config.zoneInfo[displayedZone]}
                onImageClick={onImageClick}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/** Lightbox overlay for viewing full-size images */
function Lightbox({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.92)] flex flex-col items-center justify-center gap-4 cursor-zoom-out animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-6 font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim hover:text-accent transition-colors px-3 py-1.5 border border-border hover:border-accent cursor-pointer"
        onClick={onClose}
      >
        ✕ CLOSE
      </button>
      <Image
        src={src}
        alt={label}
        width={1200}
        height={800}
        className="max-w-[90vw] max-h-[82vh] object-contain border border-border shadow-[0_0_60px_rgba(0,229,204,0.1)]"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
        {label}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function MapsClient() {
  const [activeTab, setActiveTab] = useState(0);
  const [cameras, setCameras] = useState<CameraMap>({});
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  // Fetch camera data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/stabilization/latest", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled && json.data?.cameras) {
          setCameras(json.data.cameras);
        }
      } catch {
        // Silently fail — cards show "--"
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const openLightbox = useCallback((src: string, label: string) => {
    setLightbox({ src, label });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  return (
    <>
      {/* Sub-tab navigation */}
      <div className="bg-panel border-b border-border px-4 sm:px-8 flex gap-0 -mx-4 sm:-mx-8 mb-8 overflow-x-auto">
        {MAPS.map((map, i) => (
          <button
            key={map.id}
            className={`font-[var(--font-display)] text-[0.6rem] tracking-[3px] uppercase px-5 sm:px-7 py-3 cursor-pointer border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === i
                ? "text-accent2 border-accent2 bg-accent2/5"
                : "text-dim border-transparent hover:text-foreground hover:bg-accent/5"
            }`}
            onClick={() => setActiveTab(i)}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeTab === i ? "bg-accent2 shadow-[0_0_5px_var(--color-accent2)]" : "bg-current"
              }`}
            />
            {map.displayName}
          </button>
        ))}
      </div>

      {/* Active map panel */}
      <MapPanel
        key={MAPS[activeTab].id}
        config={MAPS[activeTab]}
        cameras={cameras}
        onImageClick={openLightbox}
      />

      {/* Lightbox */}
      {lightbox && (
        <Lightbox src={lightbox.src} label={lightbox.label} onClose={closeLightbox} />
      )}
    </>
  );
}
