import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Clock, Users, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrizePool } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';
import { ASSETS } from '../assets/images/index.js';

interface Props {
  userId: string;
  onClose: () => void;
}

export const PrizePoolModal: React.FC<Props> = ({ userId, onClose }) => {
  const [pools, setPools] = useState<PrizePool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [entering, setEntering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await api.getPrizePools(userId);
      setPools(res);
    } catch (e) {
      console.error('Failed to load prize pools:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [userId]);

  const handleEnter = async (poolId: string) => {
    setEntering(true);
    setError(null);
    triggerHaptic('medium');

    try {
      await api.enterPrizePool(userId, poolId);
      triggerHaptic('success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      fetchPools();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Entry failed';
      setError(msg);
      triggerHaptic('error');
    } finally {
      setEntering(false);
    }
  };

  const pool = pools[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Community Prize Pool</h2>
              <div className="text-[11px] text-slate-400">Sponsored community reward vault</div>
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

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : pool ? (
          <div className="space-y-4 text-center">
            {/* Vault visual */}
            <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-950/80 border border-slate-700/60 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
              <img
                src={ASSETS.prizePoolVault}
                alt="Prize Pool Vault"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-slate-400">Total Grand Prize</div>
              <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-0.5">
                {formatUSD(pool.prize_amount_cents)}
              </div>
              <div className="text-xs text-purple-400 font-semibold mt-1">
                Divided across top {pool.winner_count} randomly drawn participants
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>Participants</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {pool.participant_count} Registered
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Drawing Date</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {new Date(pool.end_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Eligibility Rule */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Eligibility Requirements:</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Complete at least {pool.min_tasks_required} promotional tasks and maintain official channel membership.
              </p>
            </div>

            {/* Action */}
            {pool.isEntered ? (
              <div className="py-3 px-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>You are successfully entered in this Vault drawing!</span>
              </div>
            ) : (
              <button
                onClick={() => handleEnter(pool.id)}
                disabled={entering}
                className="w-full min-h-[48px] rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-98 transition-all"
              >
                {entering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enter Vault Pool</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
