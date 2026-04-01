import { useThemeStore } from '../store/theme.store';

export function Settings() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Theme</h3>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize font-medium ${
                theme === t
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
