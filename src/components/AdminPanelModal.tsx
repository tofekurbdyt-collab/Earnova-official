import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  DollarSign,
  Users,
  CheckSquare,
  ArrowUpRight,
  TrendingUp,
  Pickaxe,
  AlertTriangle,
  RefreshCw,
  Plus,
  Check,
  Ban,
  Filter,
} from 'lucide-react';
import { api, formatUSD } from '../lib/api.js';
import { triggerHaptic } from '../lib/telegram.js';

interface Props {
  onClose: () => void;
}

export const AdminPanelModal: React.FC<Props> = ({ onClose }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'OVERVIEW' | 'WITHDRAWALS' | 'TASKS' | 'CAMPAIGNS' | 'MINING' | 'USERS' | 'FRAUD'
  >('OVERVIEW');

  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New task form state
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState('Telegram');
  const [newTaskRewardCents, setNewTaskRewardCents] = useState(5);
  const [newTaskActionUrl, setNewTaskActionUrl] = useState('https://t.me/earnova_official');

  // Mining config state
  const [miningRate, setMiningRate] = useState(0.001);
  const [miningDuration, setMiningDuration] = useState(480);
  const [miningEnabled, setMiningEnabled] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [s, w, c, u, f] = await Promise.all([
        api.getAdminStats(),
        api.getAdminWithdrawals(),
        api.getAdminCampaigns(),
        api.getAdminUsers(),
        api.getAdminFraudFlags(),
      ]);
      setStats(s);
      setWithdrawals(w);
      setCampaigns(c);
      setUsers(u);
      setFraudFlags(f);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleWithdrawalAction = async (withdrawalId: string, action: string) => {
    triggerHaptic('medium');
    try {
      await api.processAdminWithdrawal(withdrawalId, action, `Action ${action} executed by Admin`);
      setActionMessage(`Withdrawal ${action.toLowerCase()} processed successfully.`);
      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionMessage(`Error: ${msg}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    try {
      await api.saveAdminTask({
        title: newTaskTitle,
        description: newTaskDesc,
        platform: newTaskPlatform,
        reward_cents: Number(newTaskRewardCents),
        action_url: newTaskActionUrl,
        category: newTaskPlatform.toLowerCase() === 'telegram' ? 'telegram' : 'social',
        verification_method: 'DWELL_TIMER',
        required_dwell_seconds: 15,
        is_active: true,
      });
      setShowNewTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setActionMessage('New task created successfully and published live!');
      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      setActionMessage(`Error: ${msg}`);
    }
  };

  const handleSaveMiningConfig = async () => {
    triggerHaptic('medium');
    try {
      await api.saveAdminMiningConfig({
        rate_cents_per_minute: Number(miningRate),
        duration_minutes: Number(miningDuration),
        enabled: miningEnabled,
      });
      setActionMessage('Mining parameters updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setActionMessage(`Error: ${msg}`);
    }
  };

  const handleToggleSuspend = async (userId: string) => {
    triggerHaptic('heavy');
    try {
      await api.toggleUserSuspension(userId, 'Compliance hold by Admin');
      setActionMessage('User status toggled.');
      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setActionMessage(`Error: ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-xl">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Earnova Admin Console</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Root
                </span>
              </h2>
              <div className="text-[11px] text-slate-400">Live system management & ledger audits</div>
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

        {/* Admin Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 shrink-0">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'WITHDRAWALS', label: `Withdrawals (${withdrawals.filter((w) => w.status === 'PENDING').length})` },
            { id: 'TASKS', label: 'Tasks' },
            { id: 'CAMPAIGNS', label: 'Campaigns' },
            { id: 'MINING', label: 'Mining' },
            { id: 'USERS', label: `Users (${users.length})` },
            { id: 'FRAUD', label: `Fraud Flags (${fraudFlags.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveAdminTab(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === tab.id
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionMessage && (
          <div className="mb-2 p-2 rounded-xl bg-slate-800 text-xs text-emerald-300 flex items-center justify-between shrink-0">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          ) : activeAdminTab === 'OVERVIEW' ? (
            <div className="space-y-4">
              {/* Stats KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Users</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {String(stats?.totalUsers || 0)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Today's New Users</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    +{String(stats?.todayNewUsers || 0)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tasks Completed</div>
                  <div className="text-xl font-bold text-cyan-400 mt-0.5">
                    {String(stats?.tasksCompleted || 0)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total User Rewards</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
                    {formatUSD(Number(stats?.totalUserRewardsCents || 0))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Withdrawals</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5 tabular-nums">
                    {formatUSD(Number(stats?.totalWithdrawalsCents || 0))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Platform Gross Margin</div>
                  <div className="text-xl font-bold text-purple-400 mt-0.5 tabular-nums">
                    {formatUSD(Number(stats?.totalPlatformMarginCents || 0))}
                  </div>
                </div>
              </div>

              {/* Quick Summary Note */}
              <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-white">Earnova Revenue Engine:</span> Advertiser budgets are strictly bifurcated into User Reward Pools and Platform Retained Gross Margin. No reward transaction is issued without campaign budget collateral.
              </div>
            </div>
          ) : activeAdminTab === 'WITHDRAWALS' ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Withdrawal Requests Queue ({withdrawals.length})
              </h3>
              {withdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No withdrawal requests on file.
                </div>
              ) : (
                <div className="space-y-2">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">@{w.username}</span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                              w.status === 'PAID'
                                ? 'bg-emerald-950 text-emerald-400'
                                : w.status === 'REJECTED'
                                ? 'bg-rose-950 text-rose-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono mt-0.5 truncate max-w-xs">
                          {w.method} · {w.destination_address}
                        </div>
                        {w.admin_note && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            Note: {w.admin_note}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="font-bold text-white tabular-nums">
                            {formatUSD(w.net_amount_cents)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Fee: {formatUSD(w.fee_cents)}
                          </div>
                        </div>

                        {w.status === 'PENDING' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'PAID')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'REJECT')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeAdminTab === 'TASKS' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Promotional Tasks Management
                </h3>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>

              {/* Task Creation Form Modal */}
              {showNewTaskModal && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="text-xs font-bold text-white">Create New Task</div>
                  <input
                    type="text"
                    required
                    placeholder="Task Title (e.g. Join Earnova Discussion)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                  <textarea
                    required
                    placeholder="Task Description"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Platform</label>
                      <select
                        value={newTaskPlatform}
                        onChange={(e) => setNewTaskPlatform(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      >
                        <option value="Telegram">Telegram</option>
                        <option value="X">X (Twitter)</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Web">Web Link</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Reward (Cents)</label>
                      <input
                        type="number"
                        min="1"
                        value={newTaskRewardCents}
                        onChange={(e) => setNewTaskRewardCents(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <input
                    type="url"
                    required
                    placeholder="Action URL (e.g. https://t.me/...)"
                    value={newTaskActionUrl}
                    onChange={(e) => setNewTaskActionUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTaskModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Publish Task
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeAdminTab === 'CAMPAIGNS' ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sponsored Partner Campaigns
              </h3>
              <div className="space-y-2">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{camp.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                        {camp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-2">Advertiser: {camp.advertiser_name}</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-400">Total Budget</div>
                        <div className="text-white font-bold mt-0.5">{formatUSD(camp.advertiser_budget_cents)}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-400">User Pool</div>
                        <div className="text-emerald-400 font-bold mt-0.5">{formatUSD(camp.user_reward_pool_cents)}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-400">Platform Margin</div>
                        <div className="text-purple-400 font-bold mt-0.5">{formatUSD(camp.platform_revenue_cents)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeAdminTab === 'MINING' ? (
            <div className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mining Accrual Engine Settings
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Accrual Rate in Cents / Minute (0.001 cents = $0.00001/min)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={miningRate}
                    onChange={(e) => setMiningRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Session Duration in Minutes (480 = 8h)</label>
                  <input
                    type="number"
                    value={miningDuration}
                    onChange={(e) => setMiningDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="miningEnable"
                    checked={miningEnabled}
                    onChange={(e) => setMiningEnabled(e.target.checked)}
                    className="rounded bg-slate-900"
                  />
                  <label htmlFor="miningEnable" className="text-white font-medium">
                    Enable In-App Mining Globally
                  </label>
                </div>

                <button
                  onClick={handleSaveMiningConfig}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Global Mining Configuration
                </button>
              </div>
            </div>
          ) : activeAdminTab === 'USERS' ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                User Registry & Access Control ({users.length})
              </h3>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>@{u.username}</span>
                        {u.is_suspended && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ID: {u.telegram_id} · Ref Code: {u.referral_code}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSuspend(u.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                        u.is_suspended
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {u.is_suspended ? 'Restore Account' : 'Suspend'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeAdminTab === 'FRAUD' ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Automated Anti-Abuse & Fraud Triggers ({fraudFlags.length})
              </h3>
              {fraudFlags.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No fraud flags recorded. Network integrity verified.
                </div>
              ) : (
                <div className="space-y-2">
                  {fraudFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-rose-300 font-bold">
                        <span>Flag: {flag.flag_type}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400">
                          {flag.severity}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        User: {flag.user_id} · {new Date(flag.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
