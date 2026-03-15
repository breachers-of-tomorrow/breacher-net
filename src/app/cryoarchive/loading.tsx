export default function DashboardLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 animate-pulse">
      {/* Next update bar skeleton */}
      <div className="bg-panel border-b border-border p-2 px-4 flex items-center gap-4 mb-6">
        <div className="h-3 w-24 bg-border rounded" />
        <div className="h-3 w-16 bg-border rounded" />
        <div className="flex-1 h-[3px] bg-border ml-2.5" />
      </div>

      {/* CTA banner skeleton */}
      <div className="cryo-panel p-6 mb-8 flex items-center gap-5">
        <div className="w-10 h-10 bg-border rounded shrink-0" />
        <div className="flex-1">
          <div className="h-3 w-32 bg-border mb-2 rounded" />
          <div className="h-3 w-64 bg-border rounded" />
        </div>
      </div>

      {/* Sector state skeleton */}
      <div className="h-3 w-24 bg-border mb-4 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="cryo-panel p-4">
            <div className="h-3 w-16 bg-border mb-3 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-border rounded" />
              <div className="h-5 w-16 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Kill count skeleton */}
      <div className="h-3 w-32 bg-border mb-4 rounded" />
      <div className="cryo-panel p-6 mb-8 flex items-center gap-8">
        <div>
          <div className="h-3 w-20 bg-border mb-2 rounded" />
          <div className="h-10 w-40 bg-border rounded" />
        </div>
        <div className="ml-auto">
          <div className="h-3 w-32 bg-border rounded" />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="h-3 w-40 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 h-[300px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING CHART DATA...
        </div>
      </div>
    </main>
  );
}
