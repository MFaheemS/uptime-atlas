import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
      <p className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
