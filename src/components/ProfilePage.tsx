import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Flame,
  Award,
  Trophy,
  TrendingUp,
  Users,
  Bell,
  FileText,
  Lock,
  Shield,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { User, Wallet } from '../types/index.js';
import { formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  user: User;
  wallet: Wallet | null;
  completedTasksCount: number;
  onOpenReferrals: () => void;
  onOpenChallenges: () => void;
  onOpenPrizePool: () => void;
  onOpenLeaderboard: () => void;
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  onSwitchUser: (mockUser: { id: number; username: string; first_name: string }) => void;
  onReverifyChannel: () => void;
}

export const ProfilePage: React.FC<Props> = ({
  user,
  wallet,
  completedTasksCount,
  onOpenReferrals,
  onOpenChallenges,
  onOpenPrizePool,
  onOpenLeaderboard,
  onOpenNotifications,
  onOpenAdmin,
  onSwitchUser,
  onReverifyChannel,
}) => {
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);

  const memberDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-md shrink-0">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xl font-extrabold text-emerald-400">
                {user.first_name ? user.first_name[0].toUpperCase() : 'E'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white truncate">
                {user.first_name} {user.last_name || ''}
              </h2>
              {user.channel_verified && (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">@{user.username}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
              <span>ID: {user.telegram_id}</span>
              <span>·</span>
              <span>Member since {memberDate}</span>
            </div>
          </div>
        </div>

        {/* 4 Quick KPI Blocks */}
        <div className="grid grid-cols-4 gap-1.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Earned</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5 tabular-nums">
              {formatUSD(wallet?.total_earned_cents || 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Tasks</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {completedTasksCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Streak</div>
            <div className="text-xs font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
              <Flame className="w-3 h-3 fill-amber-400/20" />
              <span>{user.streak_days}d</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Channel</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              {user.channel_verified ? 'Joined' : 'Locked'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Navigation Links */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenReferrals();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Referral Program</div>
              <div className="text-[10px] text-slate-400">Share your invite link & earn $0.10/friend</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenChallenges();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Challenges & Milestones</div>
              <div className="text-[10px] text-slate-400">Claim bonuses for completing task goals</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenLeaderboard();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Weekly Leaderboard</div>
              <div className="text-[10px] text-slate-400">See top network pioneers & rankings</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenPrizePool();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Prize Pool Vault</div>
              <div className="text-[10px] text-slate-400">$250.00 community giveaway vault</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Admin Panel Entry */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Admin Management Console</div>
            <div className="text-[10px] text-slate-400">Manage tasks, campaigns, withdrawals, and fraud flags</div>
          </div>
        </div>
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAdmin();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold active:scale-95 transition-all"
        >
          Launch
        </button>
      </div>

      {/* App Preferences & Legal */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden text-xs">
        <div className="p-4 flex items-center justify-between">
          <span className="text-slate-300 font-medium">Haptic Touch Feedback</span>
          <button
            onClick={() => {
              setHapticsEnabled(!hapticsEnabled);
              triggerHaptic('light');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => setShowTerms(true)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-300 font-medium">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setShowPrivacy(true)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-300 font-medium">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Developer Account Switcher */}
      <div className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview & Account Switcher</span>
          </span>
          <span className="text-[10px] text-slate-400">Review Tool</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Simulate Telegram accounts or test channel lock states directly in browser:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              onSwitchUser({
                id: 74829103,
                username: 'alex_earnova',
                first_name: 'Alex',
              })
            }
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left text-xs"
          >
            <div className="font-bold text-white">@alex_earnova</div>
            <div className="text-[10px] text-slate-400">Account 1 (Primary)</div>
          </button>

          <button
            onClick={() =>
              onSwitchUser({
                id: 99482710,
                username: 'sarah_crypto',
                first_name: 'Sarah',
              })
            }
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left text-xs"
          >
            <div className="font-bold text-white">@sarah_crypto</div>
            <div className="text-[10px] text-slate-400">Account 2 (Invitee)</div>
          </button>
        </div>

        <button
          onClick={onReverifyChannel}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium text-center"
        >
          Re-open Channel Verification Gate
        </button>
      </div>

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Terms of Service</h3>
              <button
                onClick={() => setShowTerms(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                1. <strong>Platform Nature</strong>: Earnova is a legitimate promotional rewards and task marketplace connecting advertisers with verified Telegram users.
              </p>
              <p>
                2. <strong>In-App Mining</strong>: The mining feature is an in-app reward accrual mechanism calculated using secure server timestamps. It is not cryptographic proof-of-work mining.
              </p>
              <p>
                3. <strong>Anti-Abuse</strong>: Multiple accounts, automated scripts, and synthetic referrals are strictly prohibited and result in permanent forfeiture of accumulated balances.
              </p>
              <p>
                4. <strong>Withdrawals</strong>: Minimum withdrawal threshold is $2.00 USD. All payout requests undergo compliance checks before transfer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                1. <strong>Collected Data</strong>: We collect Telegram user ID, display name, and task completion logs strictly to verify eligibility and credit balances.
              </p>
              <p>
                2. <strong>Financial Information</strong>: We do not store sensitive payment credentials. Destination wallet addresses are used solely to fulfill approved payouts.
              </p>
              <p>
                3. <strong>Data Protection</strong>: User balances and ledger transactions are protected behind strict server-authoritative databases and Row-Level Security policies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
