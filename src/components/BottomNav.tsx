import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Database, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/memory', label: 'Memory', icon: Database },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-touch py-1.5 px-1 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                isActive
                  ? 'text-brand-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
            <span className="text-[11px] tracking-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
