import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5DC] font-sans text-right">
      {user && (
        <header className="bg-[#800020] text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold">نظام التوصيل الداخلي داماس</h1>
            <div className="flex items-center gap-4">
              <span>مرحباً، {user.name}</span>
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
