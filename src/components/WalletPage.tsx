import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Pickaxe,
  CheckSquare,
  Users,
  Award,
} from 'lucide-react';
import { Wallet, WalletTransaction } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  userId: string;
  wallet: Wallet | null;
  onOpenWithdraw: () => void;
}

export const WalletPage: React.FC<Props> = ({ userId, wallet, onOpenWithdraw }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getWalletTransactions(userId);
      setTransactions(res.transactions || []);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const filters = [
    { id: 'all', label: 'All History' },
    { id: 'TASK_REWARD', label: 'Tasks' },
    { id: 'MINING_REWARD', label: 'Mining' },
    { id: 'REFERRAL_REWARD', label: 'Referrals' },
    { id: 'WITHDRAWAL', label: 'Withdrawals' },
    { id: 'CHALLENGE_REWARD', label: 'Challenges' },
  ];

  const filteredTx = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'TASK_REWARD':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'MINING_REWARD':
        return <Pickaxe className="w-4 h-4 text-cyan-400" />;
      case 'REFERRAL_REWARD':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'CHALLENGE_REWARD':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Earnova Wallet</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Immutable Ledger
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited balance ledger backed by real-time cryptographic transaction history.
        </p>
      </div>

      {/* Primary Balance Glass Card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden glass-glow-emerald">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Balance
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-900/40">
            Ready to Withdraw
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-4">
          {formatUSD(wallet?.available_balance_cents || 0)}
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-4 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Pending</div>
            <div className="text-xs font-bold text-amber-400 tabular-nums">
              {formatUSD(wallet?.pending_balance_cents || 0)}
            </div>
          </div>
          <div className="border-x border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-medium">Total Earned</div>
            <div className="text-xs font-bold text-emerald-400 tabular-nums">
              {formatUSD(wallet?.total_earned_cents || 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Withdrawn</div>
            <div className="text-xs font-bold text-slate-300 tabular-nums">
              {formatUSD(wallet?.total_withdrawn_cents || 0)}
            </div>
          </div>
        </div>

        {/* Withdraw Action Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenWithdraw();
          }}
          className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw Available Balance</span>
        </button>
      </div>

      {/* Ledger Transaction History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span>Transaction Ledger</span>
          </div>
          <span className="text-[11px] text-slate-400">{filteredTx.length} records</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                triggerHaptic('selection');
                setFilterType(f.id);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ledger Entries */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="py-10 px-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-300">No transactions recorded yet</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Complete tasks or run mining to populate your ledger.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTx.map((tx) => {
              const isCredit = tx.amount_cents > 0;
              const formattedDate = new Date(tx.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formattedDate}</span>
                        <span>·</span>
                        <span className="uppercase font-mono text-[9px] text-slate-400">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {formatUSD(tx.amount_cents)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Bal: {formatUSD(tx.balance_after_cents)}
                    </div>
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
