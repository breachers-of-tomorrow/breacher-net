export default function MapsLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1400px] mx-auto py-8 animate-pulse">
      <div className="h-3 w-28 bg-border mb-4 rounded" />

      {/* Map controls skeleton */}
      <div className="flex gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-panel border border-border rounded" />
        ))}
      </div>

      {/* Map area skeleton */}
      <div className="cryo-panel p-4 h-[500px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING MAP DATA...
        </div>
      </div>
    </main>
  );
}
