import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import BetaAuthModal from '../../components/BetaAuthModal';
import {
  DoorOpen,
  LayoutGrid,
  Wrench,
  Key,
  FileSpreadsheet,
  Home,
  ChevronRight,
  Building
} from 'lucide-react';

const DoorsLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showLogin, setShowLogin] = React.useState(false);

  const navItems = [
    { path: '/doors', label: 'Overview', icon: LayoutGrid, exact: true },
    { path: '/doors/schedule', label: 'Door Schedule', icon: DoorOpen },
    { path: '/doors/hardware', label: 'Hardware Sets', icon: Wrench },
    { path: '/doors/masterkey', label: 'Master Key', icon: Key },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Beta Auth Modal */}
      {showLogin && (
        <BetaAuthModal onClose={() => setShowLogin(false)} />
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-slate-500 hover:text-slate-700 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <Link to="/hub" className="text-slate-500 hover:text-slate-700 transition-colors">
                Hub
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-medium">Door Hardware</span>
            </div>

            {/* User section */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {user.email}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  Beta Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 min-h-[calc(100vh-56px)] bg-white border-r border-slate-200 sticky top-14 self-start">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Door Hardware</h2>
                <p className="text-xs text-slate-500">Specification Module</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Building className="w-5 h-5 text-slate-400" />
                Full Application
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoorsLayout;
