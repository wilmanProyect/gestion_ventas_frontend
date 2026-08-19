import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/presentation/useAuthStore';
import { checkPermission } from '../shared/ui/HasPermission';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: 'Inventario',
      path: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: 'Ventas y Reservas',
      path: '/ventas',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Devoluciones',
      path: '/devoluciones',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-6a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
    },
    {
      name: 'Usuarios',
      path: '/usuarios',
      isAdminOnly: true,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Roles y Permisos',
      path: '/roles',
      isAdminOnly: true,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Sucursales',
      path: '/sucursales',
      permission: 'branches:read',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const isAdmin = user?.roles.includes('Admin') || false;
  const visibleNavigation = navigation.filter((item) => {
    if (item.isAdminOnly && !isAdmin) return false;
    if (item.permission && user) {
      return checkPermission(user.roles, item.permission, user.permissions);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-slate-900/60 backdrop-blur-lg border-r border-slate-800/80 
          transition-all duration-300 ease-in-out shrink-0
          
          /* Responsive positioning: slides out on mobile/tablet, fits layout on desktop */
          fixed lg:relative top-0 bottom-0 left-0 z-40 lg:z-20
          h-screen lg:h-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2">
            {(!isCollapsed || isMobileOpen) && (
              <>
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow shadow-emerald-500/20">
                  <span className="text-sm font-bold text-slate-950">RV</span>
                </div>
                <span className="font-bold tracking-wide text-sm bg-gradient-to-r from-emerald-100 to-slate-200 bg-clip-text text-transparent">
                  VENTAS
                </span>
              </>
            )}
            {isCollapsed && !isMobileOpen && (
              <div className="mx-auto h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-950">A</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Collapse sidebar button (Desktop only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors hidden lg:block"
            >
              <svg
                className={`h-4 w-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Close sidebar drawer button (Mobile/Tablet only) */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {visibleNavigation.map((item) => {
            const isActive = location.pathname === item.path;
            const showText = !isCollapsed || isMobileOpen;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)} // Close sidebar on selection (mobile view)
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}
                `}
              >
                <div className={`${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                {showText && <span className="animate-in fade-in duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile Summary */}
        <div className="p-4 border-t border-slate-800/60 flex flex-col gap-3 shrink-0">
          {(!isCollapsed || isMobileOpen) && user && (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 uppercase text-xs shadow-inner">
                {user.name.slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">
                  {user.roles.join(', ')}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all duration-200 border border-transparent
              ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}
            `}
            title="Cerrar Sesión"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(!isCollapsed || isMobileOpen) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-900 bg-slate-950/20 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile/Tablet only) */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800/60 transition-colors lg:hidden"
              title="Menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h2 className="text-md font-bold tracking-tight text-slate-200 uppercase">
              {navigation.find((item) => item.path === location.pathname)?.name || 'ERP Dashboard'}
            </h2>
          </div>
          
          {user && (
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              Sesión iniciada como: <span className="text-slate-200 font-bold">{user.email}</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
