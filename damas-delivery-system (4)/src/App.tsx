import React from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ConfirmatriceDashboard from './pages/ConfirmatriceDashboard';
import DriverDashboard from './pages/DriverDashboard';
import ComptableDashboard from './pages/ComptableDashboard';
import FactoryDashboard from './pages/FactoryDashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800020]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'confirmatrice' && <ConfirmatriceDashboard />}
      {user.role === 'livreur' && <DriverDashboard />}
      {user.role === 'comptable' && <ComptableDashboard />}
      {user.role === 'factory' && <FactoryDashboard />}
    </Layout>
  );
}
