import React, { useState, useEffect } from 'react';
import {
  Pickaxe,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MiningData, Wallet } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';
import { ASSETS } from '../assets/images/index.js';

interface Props {
  userId: string;
  miningData: MiningData | null;
  onMiningUpdated: (data: MiningData) => void;
  onWalletUpdated: (wallet: Wallet) => void;
}

export const MiningPage: React.FC<Props> = ({
  userId,
  miningData,
  onMiningUpdated,
  onWalletUpdated,
}) => {
  const [liveAccrued, setLiveAccrued] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMiningActive = Boolean(
    miningData?.session && miningData.session.status === 'ACTIVE'
  );

  // Keep live local estimation in sync with server timestamps
  useEffect(() => {
    if (!isMiningActive || !miningData?.session) {
      setLiveAccrued(0);
      setSecondsRemaining(0);
      return;
    }

    const startTime = new Date(miningData.session.started_at).getTime();
    const endTime = new Date(miningData.session.ends_at).getTime();
    const ratePerMin = miningData.ratePerMinute;

    const tick = () => {
      const now = Date.now();
      const effectiveTime = Math.min(now, endTime);
      const elapsedMin = Math.max(0, (effectiveTime - startTime) / 60000);
      const accrued = elapsedMin * ratePerMin;
      setLiveAccrued(accrued);
      setSecondsRemaining(Math.max(0, Math.floor((endTime - now) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isMiningActive, miningData]);

  const handleStartMining = async () => {
    setLoadingAction(true);
    setError(null);
    setStatusMessage(null);
    triggerHaptic('medium');

    try {
      await api.startMining(userId);
      const updated = await api.getMiningStatus(userId);
      onMiningUpdated(updated);
      setStatusMessage('Mining session initiated! Accrual is now active.');
      triggerHaptic('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start mining';
      setError(msg);
      triggerHaptic('error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleClaimMining = async () => {
    setLoadingAction(true);
    setError(null);
    setStatusMessage(null);
    triggerHaptic('heavy');

    try {
      const res = await api.claimMining(userId);
      if (res.success) {
        triggerHaptic('success');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (res.wallet) {
          onWalletUpdated(res.wallet);
        }

        const updated = await api.getMiningStatus(userId);
        onMiningUpdated(updated);
        setStatusMessage(
          `Successfully claimed ${formatUSD(res.claimedCents, 4)} into your available balance!`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claiming failed';
      setError(msg);
      triggerHaptic('error');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Title */}
      <div className="px-1 text-center">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <span>Earnova Mining Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Server-authoritative time-based USD micro-accrual.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Futuristic Reactor Visual Card */}
      <div className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 text-center overflow-hidden shadow-2xl glass-glow-emerald">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Reactor Image Container */}
        <div className="relative w-40 h-40 mx-auto mb-4 rounded-3xl bg-slate-900/90 border border-slate-700/60 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
          <img
            src={ASSETS.miningReactor}
            alt="Mining Core Reactor"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover rounded-2xl transition-all duration-700 ${
              isMiningActive ? 'scale-105 filter drop-shadow(0 0 16px rgba(16, 185, 129, 0.4))' : 'opacity-70 grayscale-[30%]'
            }`}
          />

          {isMiningActive && (
            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl pointer-events-none" />
          )}
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 mb-3">
          <span
            className={`w-2 h-2 rounded-full ${
              isMiningActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isMiningActive ? 'Mining Active' : 'Mining Standby'}
          </span>
        </div>

        {/* Live Accrued Value */}
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
          Yield Accrued This Session
        </div>
        <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums mb-4">
          {formatUSD(liveAccrued, 5)}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Accrual Rate</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              $0.00001 <span className="text-[10px] text-slate-400 font-normal">/ min</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Time Left</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {isMiningActive ? formatTimer(secondsRemaining) : '08:00:00'}
            </div>
          </div>
        </div>

        {/* Main Action CTA */}
        {isMiningActive ? (
          <button
            onClick={handleClaimMining}
            disabled={loadingAction}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98]"
          >
            {loadingAction ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Claim Mining Yield</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleStartMining}
            disabled={loadingAction}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.98]"
          >
            {loadingAction ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Pickaxe className="w-4 h-4" />
                <span>Start 8-Hour Mining Session</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Security & Clarity Notice */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          The Earnova mining system operates as a server-verified session accrual engine. Calculations are strictly derived from verified timestamps. Client-side timers are solely visual.
        </p>
      </div>
    </div>
  );
};
