import React, { useState } from 'react';
import { X, ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Wallet } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  userId: string;
  wallet: Wallet | null;
  onClose: () => void;
  onSuccess: (updatedWallet: Wallet) => void;
}

export const WithdrawalModal: React.FC<Props> = ({
  userId,
  wallet,
  onClose,
  onSuccess,
}) => {
  const methods = [
    { id: 'USDT_TRC20', name: 'USDT (TRC-20)', feePercent: 1, minFeeCents: 5, placeholder: 'Enter TRC-20 Address (starts with T...)' },
    { id: 'TON', name: 'TON Network', feePercent: 1, minFeeCents: 5, placeholder: 'Enter TON Wallet Address or @domain' },
    { id: 'BINANCE_PAY', name: 'Binance Pay ID', feePercent: 0.5, minFeeCents: 5, placeholder: 'Enter Binance Pay ID (8-9 digits)' },
    { id: 'PAYEER', name: 'Payeer Account', feePercent: 1, minFeeCents: 5, placeholder: 'Enter Payeer Account (starts with P...)' },
  ];

  const [selectedMethodId, setSelectedMethodId] = useState<string>('USDT_TRC20');
  const [amountUsd, setAmountUsd] = useState<string>('2.00');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedMethod = methods.find((m) => m.id === selectedMethodId) || methods[0];
  const availableCents = wallet?.available_balance_cents || 0;
  const requestedCents = Math.round((parseFloat(amountUsd) || 0) * 100);

  const feeCents = Math.max(selectedMethod.minFeeCents, Math.round(requestedCents * (selectedMethod.feePercent / 100)));
  const netCents = Math.max(0, requestedCents - feeCents);

  const handleSetPercent = (pct: number) => {
    triggerHaptic('light');
    const targetCents = Math.floor(availableCents * pct);
    setAmountUsd((targetCents / 100).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requestedCents < 200) {
      setError('Minimum withdrawal threshold is $2.00');
      triggerHaptic('error');
      return;
    }

    if (requestedCents > availableCents) {
      setError('Requested amount exceeds available balance');
      triggerHaptic('error');
      return;
    }

    if (!destinationAddress.trim() || destinationAddress.length < 5) {
      setError('Please enter a valid destination address / account ID');
      triggerHaptic('error');
      return;
    }

    setSubmitting(true);
    triggerHaptic('heavy');

    try {
      const res = await api.requestWithdrawal({
        userId,
        amountCents: requestedCents,
        method: selectedMethod.id,
        destinationAddress: destinationAddress.trim(),
      });

      if (res.success) {
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        setSuccessMessage('Withdrawal request submitted! Sent to security compliance queue.');
        setTimeout(() => {
          onSuccess(res.wallet);
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(msg);
      triggerHaptic('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Request Withdrawal</h2>
              <div className="text-[11px] text-slate-400">Secure automated payout processing</div>
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

        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Request Recorded</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Available Balance Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Available Balance</div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {formatUSD(availableCents)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Minimum Payout</div>
                <div className="text-xs font-bold text-amber-400 font-mono">$2.00 USD</div>
              </div>
            </div>

            {/* Payout Methods */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Payout Gateway
              </label>
              <div className="grid grid-cols-2 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedMethodId(m.id);
                    }}
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
                      selectedMethodId === m.id
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.feePercent}% Fee</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Withdrawal Amount (USD)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetPercent(0.5)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercent(1.0)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    100% (Max)
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="2"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="2.00"
                />
              </div>
            </div>

            {/* Destination Address */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Destination Address / Account ID
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder={selectedMethod.placeholder}
              />
            </div>

            {/* Cost Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount</span>
                <span className="font-mono text-slate-200">{formatUSD(requestedCents)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network / Processing Fee</span>
                <span className="font-mono text-rose-400">-{formatUSD(feeCents)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                <span>Net to Receive</span>
                <span className="font-mono text-emerald-400">{formatUSD(netCents)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 transition-all"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Submit Withdrawal</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
