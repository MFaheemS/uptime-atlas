export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      ))}
    </div>
  );
}
