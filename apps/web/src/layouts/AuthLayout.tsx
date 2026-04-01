import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">
          UptimeAtlas
        </h1>
        <Outlet />
      </div>
    </div>
  );
}
