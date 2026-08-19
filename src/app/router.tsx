import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/presentation/useAuthStore';
import { DashboardLayout } from './DashboardLayout';
import { LoginPage } from '../modules/auth/presentation/LoginPage';
import { InventoryDashboard } from '../modules/inventory/presentation/InventoryDashboard';
import { SalesDashboard } from '../modules/sales/presentation/SalesDashboard';
import { ReturnsPage } from '../modules/sales/presentation/ReturnsPage';
import { UsersPage } from '../modules/users/presentation/UsersPage';
import { RolesPage } from '../modules/roles-permissions/presentation/RolesPage';
import { BranchesPage } from '../modules/branches/presentation/BranchesPage';

interface RouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return !token ? children : <Navigate to="/" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <InventoryDashboard />,
      },
      {
        path: 'ventas',
        element: <SalesDashboard />,
      },
      {
        path: 'devoluciones',
        element: <ReturnsPage />,
      },
      {
        path: 'usuarios',
        element: <UsersPage />,
      },
      {
        path: 'roles',
        element: <RolesPage />,
      },
      {
        path: 'sucursales',
        element: <BranchesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
