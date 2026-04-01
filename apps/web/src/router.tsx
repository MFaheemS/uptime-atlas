import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MonitorDetail } from './pages/MonitorDetail';
import { Incidents } from './pages/Incidents';
import { Settings } from './pages/Settings';
import { PublicStatus } from './pages/PublicStatus';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    path: '/status/:slug',
    element: <PublicStatus />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/monitors/:id', element: <MonitorDetail /> },
      { path: '/incidents', element: <Incidents /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
]);
