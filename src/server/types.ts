export type TransactionType =
  | 'TASK_REWARD'
  | 'MINING_REWARD'
  | 'REFERRAL_REWARD'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_REFUND'
  | 'CHALLENGE_REWARD'
  | 'PRIZE_POOL_WIN'
  | 'BONUS'
  | 'ADJUSTMENT';

export type TaskStatus =
  | 'AVAILABLE'
  | 'STARTED'
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';

export type WithdrawalMethod = 'USDT_TRC20' | 'TON' | 'BINANCE_PAY' | 'PAYEER';

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
  // All monetary values stored in cents (1 cent = $0.010, 100 cents = $1.000)
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
  amount_cents: number; // positive for credit, negative for debit
  balance_after_cents: number;
  type: TransactionType;
  reference_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Campaign {
  id: string;
  advertiser_name: string;
  title: string;
  description: string;
  advertiser_budget_cents: number;
  user_reward_pool_cents: number;
  platform_revenue_cents: number;
  campaign_fee_cents: number;
  remaining_budget_cents: number;
  target_completions: number;
  current_completions: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  start_date: string;
  end_date?: string;
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
  verification_method: 'TELEGRAM_CHANNEL' | 'DWELL_TIMER' | 'MANUAL_REVIEW' | 'EXTERNAL_LINK';
  required_dwell_seconds?: number;
  max_completions?: number;
  current_completions: number;
  is_active: boolean;
  icon?: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  campaign_id?: string;
  status: TaskStatus;
  reward_cents: number;
  verification_method: string;
  started_at: string;
  submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
}

export interface MiningSession {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  rate_cents_per_minute: number; // e.g. 0.001 cents/min ($0.00001)
  duration_minutes: number;
  claimed_cents: number;
  status: 'ACTIVE' | 'CLAIMED' | 'EXPIRED';
  claimed_at?: string;
}

export interface MiningConfig {
  enabled: boolean;
  rate_cents_per_minute: number;
  duration_minutes: number;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_username: string;
  referred_first_name: string;
  is_qualified: boolean;
  qualification_reason?: string;
  qualified_at?: string;
  reward_cents: number;
  reward_paid: boolean;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  username: string;
  amount_cents: number;
  fee_cents: number;
  net_amount_cents: number;
  method: WithdrawalMethod;
  destination_address: string;
  status: WithdrawalStatus;
  admin_note?: string;
  processed_at?: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requirement_type: 'TASKS_COMPLETED' | 'REFERRALS_QUALIFIED' | 'STREAK_DAYS';
  requirement_target: number;
  reward_cents: number;
  is_active: boolean;
  expires_at?: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  current_count: number;
  is_completed: boolean;
  is_claimed: boolean;
  claimed_at?: string;
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
  status: 'ACTIVE' | 'DRAWING' | 'DISTRIBUTED';
  participant_count: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  badge: string;
  action_label?: string;
  action_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface FraudFlag {
  id: string;
  user_id: string;
  flag_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, unknown>;
  is_resolved: boolean;
  created_at: string;
}
