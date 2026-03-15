export default function IndexLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 animate-pulse">
      <div className="h-3 w-28 bg-border mb-4 rounded" />

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-7 w-16 bg-panel border border-border rounded" />
        ))}
      </div>

      {/* Entry list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="cryo-panel p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-border rounded shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-border mb-2 rounded" />
              <div className="h-3 w-48 bg-border rounded" />
            </div>
            <div className="h-5 w-16 bg-border rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
