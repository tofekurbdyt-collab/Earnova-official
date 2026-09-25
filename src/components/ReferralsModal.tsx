import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Share2,
  Award,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ReferralData } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic, openExternalUrl } from '../lib/telegram.js';

interface Props {
  userId: string;
  onClose: () => void;
}

export const ReferralsModal: React.FC<Props> = ({ userId, onClose }) => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getReferrals(userId);
        setData(res);
      } catch (e) {
        console.error('Failed to load referrals:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const botUsername = 'EarnovaBot';
  const referralLink = data
    ? `https://t.me/${botUsername}?start=${data.referralCode}`
    : `https://t.me/${botUsername}`;

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    triggerHaptic('medium');
    const text = encodeURIComponent(
      '🚀 Join Earnova on Telegram! Complete promotional tasks, mine USD rewards daily, and withdraw instantly.'
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`;
    openExternalUrl(shareUrl);
  };

  // Determine tier
  const activeCount = data?.activeReferrals || 0;
  let tier = 'Bronze Ambassador';
  let nextGoal = 5;
  let progressPct = (activeCount / 5) * 100;

  if (activeCount >= 25) {
    tier = 'Platinum Ambassador';
    nextGoal = 50;
    progressPct = 100;
  } else if (activeCount >= 10) {
    tier = 'Gold Ambassador';
    nextGoal = 25;
    progressPct = ((activeCount - 10) / 15) * 100;
  } else if (activeCount >= 5) {
    tier = 'Silver Ambassador';
    nextGoal = 10;
    progressPct = ((activeCount - 5) / 5) * 100;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        {/* Mobile drag bar */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Earnova Partner Network</h2>
              <div className="text-[11px] text-slate-400">Invite active friends & earn $0.10/user</div>
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

        {/* Tier Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-900/40 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span>{tier}</span>
            </span>
            <span className="text-[10px] text-purple-400 font-mono">
              {activeCount} / {nextGoal} Qualified
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
            />
          </div>

          <div className="text-[10px] text-slate-400">
            Earn 10% lifetime matching bonus on partner task completions.
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Invited</div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {data?.totalReferrals || 0}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Qualified</div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
              {data?.activeReferrals || 0}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Earned</div>
            <div className="text-sm font-extrabold text-purple-400 mt-0.5">
              {formatUSD(data?.referralEarningsCents || 0)}
            </div>
          </div>
        </div>

        {/* Referral Link Copy Field */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Your Unique Invite Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white shrink-0 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShareTelegram}
            className="w-full min-h-[46px] rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 active:scale-98 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share directly on Telegram</span>
          </button>
        </div>

        {/* Anti-Abuse Qualification Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400 mb-4">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            To prevent botting and fake referrals, rewards unlock automatically when your invited user joins the official channel and completes their first promotional mission.
          </p>
        </div>

        {/* Referred Friends List */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Invited Partners ({data?.referralsList.length || 0})
          </h3>
          {data?.referralsList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
              No partners joined with your link yet. Share above to start earning!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {data?.referralsList.map((ref) => (
                <div
                  key={ref.id}
                  className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">@{ref.referred_username}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      ref.is_qualified
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ref.is_qualified ? 'Qualified (+$0.10)' : 'Pending Tasks'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
