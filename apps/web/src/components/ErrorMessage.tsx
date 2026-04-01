export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 text-sm font-medium text-red-600 dark:text-red-400 hover:underline shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
