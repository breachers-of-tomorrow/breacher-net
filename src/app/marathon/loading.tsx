export default function MarathonLoading() {
  return (
    <main className="px-4 sm:px-8 max-w-[1200px] mx-auto py-8 sm:py-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center mb-10">
        <div className="h-8 w-64 bg-border rounded mx-auto mb-3" />
        <div className="h-4 w-80 bg-border rounded mx-auto" />
      </div>

      {/* Quick links skeleton */}
      <div className="flex justify-center gap-4 mb-10">
        <div className="h-9 w-40 bg-border rounded" />
        <div className="h-9 w-44 bg-border rounded" />
      </div>

      {/* Kill count hero skeleton */}
      <div className="h-3 w-28 bg-border mb-4 rounded" />
      <div className="cryo-panel p-6 mb-8 flex items-center gap-8">
        <div>
          <div className="h-3 w-20 bg-border mb-2 rounded" />
          <div className="h-10 w-48 bg-border rounded" />
        </div>
        <div className="ml-auto text-right">
          <div className="h-3 w-24 bg-border rounded" />
        </div>
      </div>

      {/* ETA skeleton */}
      <div className="cryo-panel p-5 mb-8 h-[140px]" />

      {/* Chart skeletons */}
      <div className="h-3 w-36 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 h-[300px] mb-8" />

      <div className="h-3 w-40 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 h-[260px] mb-8" />

      {/* Analytics skeleton */}
      <div className="h-3 w-28 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 h-[120px]" />
    </main>
  );
}
