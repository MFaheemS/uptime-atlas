import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

export function AppLayout() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const navLinks = (
    <>
      <Link
        to="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
      >
        Dashboard
      </Link>
      <Link
        to="/incidents"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
      >
        Incidents
      </Link>
      <Link
        to="/settings"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
      >
        Settings
      </Link>
    </>
  );

  const bottomControls = (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button
        onClick={handleLogout}
        className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400"
      >
        Logout
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">UptimeAtlas</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">{navLinks}</nav>
        {bottomControls}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-3"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">UptimeAtlas</h1>
        <button
          onClick={toggleTheme}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-white dark:bg-gray-800 flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">UptimeAtlas</h1>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">{navLinks}</nav>
            {bottomControls}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-14">
        <Outlet />
      </main>
    </div>
  );
}
