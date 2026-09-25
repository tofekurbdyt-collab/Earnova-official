import React, { useState, useEffect } from 'react';
import {
  Pickaxe,
  CheckSquare,
  Users,
  ArrowUpRight,
  Flame,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { User, Wallet, MiningData, Announcement, TabType } from '../types/index.js';
import { formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';
import { ASSETS } from '../assets/images/index.js';

interface Props {
  user: User;
  wallet: Wallet | null;
  mining: MiningData | null;
  announcements: Announcement[];
  todayEarningsCents: number;
  completedTasksCount: number;
  onNavigateTab: (tab: TabType) => void;
  onOpenWithdraw: () => void;
  onOpenReferrals: () => void;
  onOpenChallenges: () => void;
  onOpenPrizePool: () => void;
}

export const HomePage: React.FC<Props> = ({
  user,
  wallet,
  mining,
  announcements,
  todayEarningsCents,
  completedTasksCount,
  onNavigateTab,
  onOpenWithdraw,
  onOpenReferrals,
  onOpenChallenges,
  onOpenPrizePool,
}) => {
  // Real-time ticking accumulated mining amount for UI responsiveness
  const [liveAccruedCents, setLiveAccruedCents] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const isMiningActive = Boolean(mining?.session && mining.session.status === 'ACTIVE');

  useEffect(() => {
    if (!isMiningActive || !mining?.session) {
      setLiveAccruedCents(0);
      setSecondsRemaining(0);
      return;
    }

    const startTime = new Date(mining.session.started_at).getTime();
    const endTime = new Date(mining.session.ends_at).getTime();
    const ratePerMin = mining.ratePerMinute;

    const interval = setInterval(() => {
      const now = Date.now();
      const effectiveTime = Math.min(now, endTime);
      const elapsedMin = Math.max(0, (effectiveTime - startTime) / 60000);
      const accrued = elapsedMin * ratePerMin;
      setLiveAccruedCents(accrued);
      setSecondsRemaining(Math.max(0, Math.floor((endTime - now) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMiningActive, mining]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Welcome & Streak Banner */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            Hello, {user.first_name}
            <span className="text-xs font-normal text-emerald-400">👋</span>
          </h1>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span>Official Earnova Member</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          <span className="text-xs font-bold font-mono">{user.streak_days} Day Streak</span>
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl overflow-hidden glass-glow-emerald">
        {/* Background glow node */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
            Available Balance
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-4">
            {formatUSD(wallet?.available_balance_cents || 0)}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
            <div>
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Today's Earnings</div>
              <div className="text-sm font-bold text-emerald-400 tabular-nums">
                +{formatUSD(todayEarningsCents)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Total Earned</div>
              <div className="text-sm font-bold text-slate-200 tabular-nums">
                {formatUSD(wallet?.total_earned_cents || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (4 Buttons) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('mining');
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-95 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:scale-105 transition-transform">
            <Pickaxe className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200 leading-tight">Mining</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('tasks');
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-95 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1.5 group-hover:scale-105 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200 leading-tight">Tasks</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenReferrals();
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-95 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1.5 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200 leading-tight">Invite</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenWithdraw();
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-95 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1.5 group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200 leading-tight">Withdraw</span>
        </button>
      </div>

      {/* Mining Dashboard Card Preview */}
      <div
        onClick={() => {
          triggerHaptic('light');
          onNavigateTab('mining');
        }}
        className="cursor-pointer rounded-3xl p-4 bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all active:scale-[0.99] relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {isMiningActive ? 'Mining Active' : 'Mining Inactive'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/40">
            $0.00001 / min
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Accumulated</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {isMiningActive ? formatUSD(liveAccruedCents, 5) : '$0.00000'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Time Left</span>
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">
              {isMiningActive ? formatTimer(secondsRemaining) : '08:00:00'}
            </div>
          </div>
        </div>

        <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30">
          <span>{isMiningActive ? 'View Live Reactor' : 'Start Mining Session'}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Featured Sponsored Campaigns */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Featured Campaigns</span>
          </div>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
              <img
                src={ASSETS.campaignBanner}
                alt="Nexis Protocol Campaign"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cyan-400">Nexis Protocol</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Pool: $175.00
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">Nexis Global Community Launch</h3>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                Complete official partner actions and earn verified USD rewards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress & Challenges Entry */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenChallenges();
          }}
          className="cursor-pointer p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-98"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Challenges</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {completedTasksCount >= 5 ? 'Ready to Claim' : `${completedTasksCount}/5 Completed`}
          </div>
        </div>

        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenPrizePool();
          }}
          className="cursor-pointer p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all active:scale-98"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Prize Pool</div>
          <div className="text-[11px] text-slate-400 mt-0.5">$250 Alpha Vault</div>
        </div>
      </div>
    </div>
  );
};
