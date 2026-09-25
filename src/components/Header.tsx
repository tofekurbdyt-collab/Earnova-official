import React from 'react';
import { Bell, Shield, Sparkles } from 'lucide-react';
import { User } from '../types/index.js';
import { ASSETS } from '../assets/images/index.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  user: User;
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  hasUnreadAnnouncements?: boolean;
}

export const Header: React.FC<Props> = ({
  user,
  onOpenNotifications,
  onOpenAdmin,
  hasUnreadAnnouncements,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 pt-safe">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Brand logo & name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/60 p-0.5 overflow-hidden flex items-center justify-center shadow-sm">
            <img
              src={ASSETS.logo}
              alt="Earnova"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">Earnova</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Complete. Earn. Grow.</div>
          </div>
        </div>

        {/* Right: User pill, Notifications, and Admin toggle */}
        <div className="flex items-center gap-1.5">
          {/* Quick Admin Access */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAdmin();
            }}
            title="Admin Console"
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenNotifications();
            }}
            title="Announcements"
            className="relative w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadAnnouncements && (
              <span className="absolute 1 top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>

          {/* User Avatar Mini */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-sm">
              {user.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {user.first_name ? user.first_name[0].toUpperCase() : 'E'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
