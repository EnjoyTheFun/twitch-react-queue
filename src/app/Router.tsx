import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { LoadingOverlay } from '@mantine/core';
import AuthPage from '../features/auth/AuthPage';
import IfAuthenticated from '../features/auth/IfAuthenticated';
import RequireAuth from '../features/auth/RequireAuth';
import AppLayout from './AppLayout';

const HomePage = lazy(() => import('../features/home/HomePage'));
const QueuePage = lazy(() => import('../features/clips/queue/QueuePage'));
const HistoryPage = lazy(() => import('../features/clips/history/HistoryPage'));

const PageLoader = () => (
  <LoadingOverlay visible loaderProps={{ size: 'xl' }} />
);

function Router() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASEPATH}>
      <Routes>
        <Route
          path="auth"
          element={
            <IfAuthenticated otherwise={<AuthPage />}>
              <Navigate to="/queue" replace />
            </IfAuthenticated>
          }
        />
        <Route
          element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </AppLayout>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route
            path="queue"
            element={
              <RequireAuth>
                <QueuePage />
              </RequireAuth>
            }
          />
          <Route
            path="history"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
