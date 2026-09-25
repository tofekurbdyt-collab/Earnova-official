import React from 'react';
import { Home, CheckSquare, Pickaxe, Wallet as WalletIcon, User as UserIcon } from 'lucide-react';
import { TabType } from '../types/index.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  miningActive: boolean;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onSelectTab, miningActive }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'mining' as TabType, label: 'Mining', icon: Pickaxe, badge: miningActive },
    { id: 'wallet' as TabType, label: 'Wallet', icon: WalletIcon },
    { id: 'profile' as TabType, label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                onSelectTab(tab.id);
              }}
              className="relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all group"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform group-active:scale-90 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
