import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSkeleton } from './components/LoadingSkeleton';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const MonitorDetail = lazy(() =>
  import('./pages/MonitorDetail').then((m) => ({ default: m.MonitorDetail })),
);
const Incidents = lazy(() => import('./pages/Incidents').then((m) => ({ default: m.Incidents })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const PublicStatus = lazy(() =>
  import('./pages/PublicStatus').then((m) => ({ default: m.PublicStatus })),
);
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function Loading() {
  return (
    <div className="p-6">
      <LoadingSkeleton rows={3} />
    </div>
  );
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <S>
            <Login />
          </S>
        ),
      },
      {
        path: '/register',
        element: (
          <S>
            <Register />
          </S>
        ),
      },
    ],
  },
  {
    path: '/status/:slug',
    element: (
      <S>
        <PublicStatus />
      </S>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: (
          <S>
            <Dashboard />
          </S>
        ),
      },
      {
        path: '/monitors/:id',
        element: (
          <S>
            <MonitorDetail />
          </S>
        ),
      },
      {
        path: '/incidents',
        element: (
          <S>
            <Incidents />
          </S>
        ),
      },
      {
        path: '/settings',
        element: (
          <S>
            <Settings />
          </S>
        ),
      },
      {
        path: '*',
        element: (
          <S>
            <NotFound />
          </S>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <S>
        <NotFound />
      </S>
    ),
  },
]);
