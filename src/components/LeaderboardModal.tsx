import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, Medal, Users, CheckSquare } from 'lucide-react';
import { LeaderboardEntry } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ onClose }) => {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getLeaderboard();
        setBoard(data);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300/20" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700 fill-amber-700/20" />;
    return <span className="font-mono font-bold text-xs text-slate-400">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Weekly Leaderboard</h2>
              <div className="text-[11px] text-slate-400">Top earning network pioneers</div>
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

        {loading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {board.map((item) => (
              <div
                key={item.rank}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  item.rank <= 3
                    ? 'bg-slate-950/80 border-slate-700/80 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {getRankBadge(item.rank)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono">@{item.username}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-2.5 h-2.5" /> {item.tasksCompleted} tasks
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> {item.referralsCount} referrals
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                    {formatUSD(item.totalEarnedCents)}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">Earned</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
