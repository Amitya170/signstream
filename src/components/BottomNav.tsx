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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-h-touch py-1.5 px-1 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isActive
                  ? 'text-teal-700 font-bold bg-teal-50 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shadow-sm" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-teal-600' : ''}`} aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
