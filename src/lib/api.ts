import {
  User,
  Wallet,
  Task,
  MiningData,
  Challenge,
  PrizePool,
  ReferralData,
  LeaderboardEntry,
  Announcement,
  WalletTransaction,
} from '../types/index.js';

/**
 * Format monetary cents into clean USD string.
 * cents: 100 = $1.00, 5 = $0.05, 0.1 = $0.001
 */
export function formatUSD(cents: number, decimals?: number): string {
  const dollars = cents / 100;
  if (decimals !== undefined) {
    return `$${dollars.toFixed(decimals)}`;
  }
  if (cents >= 100) {
    return `$${dollars.toFixed(2)}`;
  }
  if (cents >= 1) {
    return `$${dollars.toFixed(cents % 1 === 0 ? 2 : 3)}`;
  }
  if (cents === 0) {
    return '$0.00';
  }
  return `$${dollars.toFixed(4)}`;
}

export const api = {
  async authenticate(initData?: string, mockUser?: { id: number; username?: string; first_name?: string }): Promise<{
    user: User;
    wallet: Wallet;
    isNew: boolean;
  }> {
    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, mockUser }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  },

  async verifyChannel(userId: string, simulateJoin?: 'VERIFY' | 'REJECT'): Promise<{
    success: boolean;
    verified: boolean;
    statusText: string;
    user?: User;
    verification?: { source: string; message?: string };
  }> {
    const res = await fetch('/api/channel/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, simulateJoin }),
    });
    return res.json();
  },

  async getDashboard(userId: string): Promise<{
    user: User;
    wallet: Wallet;
    mining: MiningData;
    announcements: Announcement[];
    todayEarningsCents: number;
    completedTasksCount: number;
  }> {
    const res = await fetch(`/api/user/dashboard?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  async getTasks(userId: string): Promise<Task[]> {
    const res = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return data.tasks || [];
  },

  async startTask(userId: string, taskId: string): Promise<unknown> {
    const res = await fetch('/api/tasks/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, taskId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start task');
    return data;
  },

  async submitTask(userId: string, taskId: string): Promise<{
    success: boolean;
    rewardCents: number;
    wallet: Wallet;
  }> {
    const res = await fetch('/api/tasks/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, taskId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Task submission failed');
    return data;
  },

  async getMiningStatus(userId: string): Promise<MiningData> {
    const res = await fetch(`/api/mining/status?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async startMining(userId: string): Promise<unknown> {
    const res = await fetch('/api/mining/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start mining session');
    return data;
  },

  async claimMining(userId: string): Promise<{
    success: boolean;
    claimedCents: number;
    wallet: Wallet;
  }> {
    const res = await fetch('/api/mining/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim mining rewards');
    return data;
  },

  async getReferrals(userId: string): Promise<ReferralData> {
    const res = await fetch(`/api/referrals?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getWalletTransactions(userId: string): Promise<{
    wallet: Wallet;
    transactions: WalletTransaction[];
  }> {
    const res = await fetch(`/api/wallet/transactions?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async requestWithdrawal(params: {
    userId: string;
    amountCents: number;
    method: string;
    destinationAddress: string;
  }): Promise<{
    success: boolean;
    wallet: Wallet;
    withdrawal: unknown;
  }> {
    const res = await fetch('/api/withdrawals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
    return data;
  },

  async getChallenges(userId: string): Promise<Challenge[]> {
    const res = await fetch(`/api/challenges?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return data.challenges || [];
  },

  async claimChallenge(userId: string, challengeId: string): Promise<{
    success: boolean;
    wallet: Wallet;
  }> {
    const res = await fetch('/api/challenges/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, challengeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim challenge');
    return data;
  },

  async getPrizePools(userId: string): Promise<PrizePool[]> {
    const res = await fetch(`/api/prize-pools?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return data.pools || [];
  },

  async enterPrizePool(userId: string, poolId: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/prize-pools/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, poolId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to enter prize pool');
    return data;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    return data.leaderboard || [];
  },

  async getAdminStats(): Promise<Record<string, unknown>> {
    const res = await fetch('/api/admin/stats');
    return res.json();
  },

  async getAdminWithdrawals(): Promise<unknown[]> {
    const res = await fetch('/api/admin/withdrawals');
    const data = await res.json();
    return data.withdrawals || [];
  },

  async processAdminWithdrawal(withdrawalId: string, action: string, note?: string): Promise<unknown> {
    const res = await fetch('/api/admin/withdrawals/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId, action, note }),
    });
    return res.json();
  },

  async saveAdminTask(task: unknown): Promise<unknown> {
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  async saveAdminMiningConfig(config: unknown): Promise<unknown> {
    const res = await fetch('/api/admin/mining/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getAdminCampaigns(): Promise<unknown[]> {
    const res = await fetch('/api/admin/campaigns');
    const data = await res.json();
    return data.campaigns || [];
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    return data.users || [];
  },

  async toggleUserSuspension(userId: string, reason?: string): Promise<unknown> {
    const res = await fetch('/api/admin/users/toggle-suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason }),
    });
    return res.json();
  },

  async getAdminFraudFlags(): Promise<unknown[]> {
    const res = await fetch('/api/admin/fraud-flags');
    const data = await res.json();
    return data.flags || [];
  },
};
