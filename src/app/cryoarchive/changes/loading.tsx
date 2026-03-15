export default function ChangesLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 animate-pulse">
      <div className="h-3 w-32 bg-border mb-4 rounded" />

      {/* Latest build banner skeleton */}
      <div className="cryo-panel p-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-border rounded shrink-0" />
        <div className="flex-1">
          <div className="h-3 w-32 bg-border mb-2 rounded" />
          <div className="h-3 w-48 bg-border rounded" />
        </div>
      </div>

      {/* Build events skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="cryo-panel p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-3 w-24 bg-border rounded" />
              <div className="h-3 w-32 bg-border rounded" />
            </div>
            <div className="h-3 w-full bg-border mb-2 rounded" />
            <div className="h-3 w-3/4 bg-border rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
