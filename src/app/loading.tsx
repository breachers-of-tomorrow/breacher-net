export default function HomeLoading() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="h-10 w-64 bg-panel mx-auto mb-4 rounded" />
        <div className="h-5 w-48 bg-panel mx-auto mb-2 rounded" />
        <div className="h-4 w-80 bg-panel mx-auto rounded" />
      </div>

      {/* Quick Status skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cryo-panel p-6">
            <div className="h-3 w-24 bg-border mx-auto mb-3 rounded" />
            <div className="h-8 w-20 bg-border mx-auto rounded" />
          </div>
        ))}
      </div>

      {/* Nav cards skeleton */}
      <div className="h-3 w-32 bg-border mb-4 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="cryo-panel p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-border rounded shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-20 bg-border mb-2 rounded" />
              <div className="h-3 w-48 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
