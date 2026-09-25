import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Challenge, Wallet } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  userId: string;
  onClose: () => void;
  onWalletUpdated: (wallet: Wallet) => void;
}

export const ChallengesModal: React.FC<Props> = ({ userId, onClose, onWalletUpdated }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await api.getChallenges(userId);
      setChallenges(res);
    } catch (e) {
      console.error('Failed to fetch challenges:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  const handleClaim = async (challenge: Challenge) => {
    triggerHaptic('heavy');
    setClaimingId(challenge.id);

    try {
      const res = await api.claimChallenge(userId, challenge.id);
      if (res.success) {
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        if (res.wallet) {
          onWalletUpdated(res.wallet);
        }

        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challenge.id ? { ...c, progress: { ...c.progress, is_claimed: true } } : c
          )
        );
      }
    } catch (err) {
      console.error('Error claiming challenge:', err);
      triggerHaptic('error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Earnova Challenges</h2>
              <div className="text-[11px] text-slate-400">Accomplish milestones & unlock bonus cash</div>
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
          <div className="space-y-3">
            {challenges.map((chal) => {
              const current = chal.progress?.current_count || 0;
              const target = chal.requirement_target;
              const isReadyToClaim = chal.progress?.is_completed && !chal.progress?.is_claimed;
              const isClaimed = chal.progress?.is_claimed;
              const pct = Math.min(100, (current / target) * 100);

              return (
                <div
                  key={chal.id}
                  className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800/90 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{chal.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{chal.description}</p>
                    </div>

                    <div className="px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-800/50 text-amber-300 font-extrabold text-xs shrink-0 tabular-nums">
                      +{formatUSD(chal.reward_cents)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Progress: {current} / {target}
                    </span>

                    {isClaimed ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claimed</span>
                      </div>
                    ) : isReadyToClaim ? (
                      <button
                        onClick={() => handleClaim(chal)}
                        disabled={claimingId === chal.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                      >
                        {claimingId === chal.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Claim {formatUSD(chal.reward_cents)}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
