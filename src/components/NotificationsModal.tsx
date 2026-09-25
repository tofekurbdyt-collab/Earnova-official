import React from 'react';
import { X, Bell, ExternalLink, Sparkles } from 'lucide-react';
import { Announcement } from '../types/index.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  announcements: Announcement[];
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsModal: React.FC<Props> = ({
  announcements,
  onClose,
  onNavigateTab,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Announcements & Alerts</h2>
              <div className="text-[11px] text-slate-400">Official Earnova system bulletins</div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No active announcements right now.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann, i) => (
              <div
                key={i}
                className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-900/40">
                    {ann.badge}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>

                {ann.action_label && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                      if (onNavigateTab && ann.action_url) {
                        onNavigateTab(ann.action_url);
                      }
                    }}
                    className="mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>{ann.action_label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
