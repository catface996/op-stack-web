import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Brain, Home, Network, Database, Users, FileText, Radar, Settings, LogOut } from 'lucide-react';
import { ROUTES } from '../services/routes';

interface LayoutProps {
  currentUser: { name: string } | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

/**
 * Main application layout with header navigation
 * Uses React Router's Outlet for rendering child routes
 */
const Layout: React.FC<LayoutProps> = ({ currentUser, onLogout, onOpenSettings }) => {
  const navigate = useNavigate();

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: Home },
    { path: ROUTES.TOPOLOGIES, label: 'Topologies', icon: Network },
    { path: ROUTES.RESOURCES, label: 'Resources', icon: Database },
    { path: ROUTES.AGENTS, label: 'Agents', icon: Users },
    { path: ROUTES.REPORTS, label: 'Reports', icon: FileText },
    { path: ROUTES.DISCOVERY, label: 'Discovery', icon: Radar },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            <Brain className="text-cyan-400" size={20} />
            <span className="font-bold tracking-tight uppercase tracking-widest">
              <span className="text-white">Entropy</span>
              <span className="text-cyan-400">OPStack</span>
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <item.icon size={14} /> {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 font-medium">{currentUser.name}</span>
            </div>
          )}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
