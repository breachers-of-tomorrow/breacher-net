export default function CamerasLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 animate-pulse">
      <div className="h-3 w-24 bg-border mb-4 rounded" />

      {/* Camera grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="cryo-panel p-5">
            <div className="h-3 w-20 bg-border mb-3 rounded" />
            <div className="h-8 w-16 bg-border mb-2 rounded" />
            <div className="h-2 w-full bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-3 w-48 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 h-[350px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING CHART DATA...
        </div>
      </div>
    </main>
  );
}
