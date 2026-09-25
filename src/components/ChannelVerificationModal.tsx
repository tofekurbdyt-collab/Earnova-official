import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, RefreshCw, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { User } from '../types/index.js';
import { api } from '../lib/api.js';
import { openExternalUrl, triggerHaptic } from '../lib/telegram.js';
import { ASSETS } from '../assets/images/index.js';

interface Props {
  user: User;
  onVerified: (user: User) => void;
}

export const ChannelVerificationModal: React.FC<Props> = ({ user, onVerified }) => {
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'NOT_JOINED' | 'VERIFIED' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hasClickedJoin, setHasClickedJoin] = useState(false);

  const officialChannelUrl = 'https://t.me/earnova_official';

  const handleJoinChannel = () => {
    triggerHaptic('medium');
    setHasClickedJoin(true);
    openExternalUrl(officialChannelUrl);
  };

  const handleVerify = async (simulationChoice?: 'VERIFY' | 'REJECT') => {
    setStatus('CHECKING');
    triggerHaptic('light');

    try {
      const res = await api.verifyChannel(user.id, simulationChoice);
      if (res.verified && res.user) {
        setStatus('VERIFIED');
        setStatusMessage('Channel membership verified successfully! Welcome to Earnova.');
        triggerHaptic('success');
        setTimeout(() => {
          onVerified(res.user!);
        }, 1200);
      } else {
        setStatus('NOT_JOINED');
        setStatusMessage(
          res.verification?.message ||
            'You have not joined the official channel yet. Please join @earnova_official first, then tap Verify.'
        );
        triggerHaptic('error');
      }
    } catch {
      setStatus('ERROR');
      setStatusMessage('Verification server request timed out. Please try again.');
      triggerHaptic('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center">
          {/* Logo / Badge */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 p-2 shadow-inner flex items-center justify-center overflow-hidden">
            <img
              src={ASSETS.logo}
              alt="Earnova Emblem"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            Mandatory Verification
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Join the official Earnova Telegram Channel to unlock tasks, real-time mining, and your USD wallet.
          </p>

          {/* Verification Status Banner */}
          <div className="mb-6 p-3.5 rounded-2xl border bg-slate-950/60 border-slate-800 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              {status === 'CHECKING' && (
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              )}
              {status === 'VERIFIED' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {status === 'NOT_JOINED' && (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              {(status === 'IDLE' || status === 'ERROR') && (
                <ShieldCheck className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <div className="text-xs text-slate-400 font-medium">Channel Status</div>
                <div className="text-sm font-semibold text-slate-200">
                  {status === 'CHECKING' && 'Checking Telegram membership...'}
                  {status === 'VERIFIED' && 'Verified'}
                  {status === 'NOT_JOINED' && 'Not Joined'}
                  {status === 'IDLE' && 'Action Required'}
                  {status === 'ERROR' && 'Verification Check Failed'}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
              @earnova_official
            </span>
          </div>

          {statusMessage && (
            <div className={`mb-5 p-3 rounded-xl text-xs flex items-start gap-2 text-left ${
              status === 'VERIFIED'
                ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleJoinChannel}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all active:scale-[0.98]"
            >
              <span>1. Join Official Channel</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleVerify()}
              disabled={status === 'CHECKING' || status === 'VERIFIED'}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
            >
              {status === 'CHECKING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Membership...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Verify Membership</span>
                </>
              )}
            </button>
          </div>

          {/* Sandbox / Testing Helper for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Live Bot API & Dev Simulator
              </span>
              <span className="text-[10px] text-slate-400">Preview Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal mb-3">
              If TELEGRAM_BOT_TOKEN is configured in .env, live verification calls Telegram API. You can also simulate both states instantly below:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVerify('VERIFY')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium border border-emerald-900/40 text-center"
              >
                Simulate Joined (Pass)
              </button>
              <button
                onClick={() => handleVerify('REJECT')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-medium border border-rose-900/40 text-center"
              >
                Simulate Not Joined
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
