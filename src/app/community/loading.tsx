export default function CommunityLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 animate-pulse">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="h-10 w-64 bg-panel mx-auto mb-4 rounded" />
        <div className="h-4 w-96 bg-panel mx-auto rounded" />
      </div>

      {/* Section */}
      <div className="h-3 w-36 bg-border mb-4 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cryo-panel p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-border rounded shrink-0" />
              <div className="h-4 w-32 bg-border rounded" />
            </div>
            <div className="h-3 w-full bg-border mb-1.5 rounded" />
            <div className="h-3 w-4/5 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Section */}
      <div className="h-3 w-32 bg-border mb-4 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="cryo-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-border rounded shrink-0" />
              <div className="h-4 w-28 bg-border rounded" />
            </div>
            <div className="h-3 w-full bg-border mb-1.5 rounded" />
            <div className="h-3 w-3/4 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Section */}
      <div className="h-3 w-40 bg-border mb-4 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {[1, 2].map((i) => (
          <div key={i} className="cryo-panel p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-border rounded shrink-0" />
              <div className="h-4 w-36 bg-border rounded" />
            </div>
            <div className="h-3 w-full bg-border mb-1.5 rounded" />
            <div className="h-3 w-2/3 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Developer section */}
      <div className="h-3 w-32 bg-border mb-4 rounded" />
      <div className="cryo-panel p-5 sm:p-6">
        <div className="h-4 w-40 bg-border mb-3 rounded" />
        <div className="h-3 w-full bg-border mb-2 rounded" />
        <div className="h-3 w-3/4 bg-border rounded" />
      </div>
    </main>
  );
}
