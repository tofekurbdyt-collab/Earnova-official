export type TabType = 'home' | 'tasks' | 'mining' | 'wallet' | 'profile';

export interface User {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  language_code: string;
  channel_verified: boolean;
  channel_verified_at?: string;
  referred_by_id?: string;
  referral_code: string;
  is_suspended: boolean;
  suspension_reason?: string;
  streak_days: number;
  last_active_at: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_balance_cents: number;
  pending_balance_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount_cents: number;
  balance_after_cents: number;
  type: string;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface Task {
  id: string;
  campaign_id?: string;
  title: string;
  description: string;
  category: 'telegram' | 'twitter' | 'social' | 'community' | 'featured' | 'sponsored';
  platform: 'Telegram' | 'X' | 'YouTube' | 'Discord' | 'Web';
  reward_cents: number;
  estimated_time: string;
  action_url: string;
  verification_method: string;
  required_dwell_seconds?: number;
  current_completions: number;
  is_active: boolean;
  submissionStatus: 'AVAILABLE' | 'STARTED' | 'PENDING_VERIFICATION' | 'COMPLETED';
}

export interface MiningData {
  session: {
    id: string;
    started_at: string;
    ends_at: string;
    rate_cents_per_minute: number;
    duration_minutes: number;
    claimed_cents: number;
    status: 'ACTIVE' | 'CLAIMED' | 'EXPIRED';
  } | null;
  ratePerMinute: number;
  durationMinutes: number;
  currentAccruedCents: number;
  timeRemainingSeconds: number;
  isEnabled: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requirement_type: string;
  requirement_target: number;
  reward_cents: number;
  is_active: boolean;
  progress: {
    id: string;
    current_count: number;
    is_completed: boolean;
    is_claimed: boolean;
  };
}

export interface PrizePool {
  id: string;
  name: string;
  prize_amount_cents: number;
  winner_count: number;
  start_date: string;
  end_date: string;
  eligibility_rule: string;
  min_tasks_required: number;
  status: string;
  participant_count: number;
  isEntered: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  badge: string;
  action_label?: string;
  action_url?: string;
}

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  referralEarningsCents: number;
  referralsList: Array<{
    id: string;
    referred_username: string;
    referred_first_name: string;
    is_qualified: boolean;
    reward_cents: number;
    created_at: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalEarnedCents: number;
  tasksCompleted: number;
  referralsCount: number;
}
