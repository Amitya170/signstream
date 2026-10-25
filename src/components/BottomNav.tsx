import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Radio, MessagesSquare, BookOpen, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/speech-to-sign', label: 'Studio', icon: Radio },
    { to: '/conversation', label: 'Chat', icon: MessagesSquare },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-h-touch py-1.5 px-1 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                isActive
                  ? 'text-teal-300 font-bold bg-teal-500/10 shadow-sm shadow-teal-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-teal-400' : ''}`} aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
