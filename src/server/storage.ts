import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Wallet,
  WalletTransaction,
  Task,
  TaskSubmission,
  Campaign,
  MiningSession,
  MiningConfig,
  Referral,
  Withdrawal,
  Challenge,
  ChallengeProgress,
  PrizePool,
  Announcement,
  FraudFlag,
  TransactionType,
} from './types.js';

interface DatabaseSchema {
  users: Record<string, User>;
  wallets: Record<string, Wallet>;
  transactions: WalletTransaction[];
  campaigns: Record<string, Campaign>;
  tasks: Record<string, Task>;
  submissions: Record<string, TaskSubmission>; // key: `${userId}_${taskId}`
  miningSessions: Record<string, MiningSession>; // key: sessionId
  miningConfig: MiningConfig;
  referrals: Referral[];
  withdrawals: Record<string, Withdrawal>;
  challenges: Record<string, Challenge>;
  challengeProgress: Record<string, ChallengeProgress>; // key: `${userId}_${challengeId}`
  prizePools: Record<string, PrizePool>;
  prizePoolEntries: { id: string; poolId: string; userId: string; createdAt: string }[];
  announcements: Announcement[];
  fraudFlags: FraudFlag[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'earnova_db.json');

class Storage {
  private db: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.tasks) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read db file, initializing fresh store:', e);
    }
    return this.initializeSeedDatabase();
  }

  private persistDatabase(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to write database file:', err);
      }
    }, 200);
  }

  private initializeSeedDatabase(): DatabaseSchema {
    const campaigns: Record<string, Campaign> = {
      'camp-1': {
        id: 'camp-1',
        advertiser_name: 'Nexis Protocol',
        title: 'Nexis Global Community Expansion',
        description: 'Join the Nexis ecosystem launch. High engagement campaign with guaranteed rewards.',
        advertiser_budget_cents: 25000, // $250.00
        user_reward_pool_cents: 17500, // $175.00 (70%)
        platform_revenue_cents: 7500, // $75.00 (30% platform margin)
        campaign_fee_cents: 0,
        remaining_budget_cents: 24200,
        target_completions: 3500,
        current_completions: 160,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      'camp-2': {
        id: 'camp-2',
        advertiser_name: 'HyperSwap DEX',
        title: 'HyperSwap Mobile Testnet Boost',
        description: 'Explore the next-generation decentralized exchange on TON and EVM.',
        advertiser_budget_cents: 50000, // $500.00
        user_reward_pool_cents: 35000, // $350.00
        platform_revenue_cents: 15000, // $150.00
        campaign_fee_cents: 0,
        remaining_budget_cents: 48500,
        target_completions: 5000,
        current_completions: 300,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    };

    const tasks: Record<string, Task> = {
      'task-1': {
        id: 'task-1',
        campaign_id: 'camp-1',
        title: 'Join Earnova Announcement Channel',
        description: 'Subscribe to our official Telegram channel for updates, flash giveaways, and promo codes.',
        category: 'telegram',
        platform: 'Telegram',
        reward_cents: 5, // $0.05
        estimated_time: '30s',
        action_url: 'https://t.me/earnova_official',
        verification_method: 'TELEGRAM_CHANNEL',
        current_completions: 1240,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      'task-2': {
        id: 'task-2',
        campaign_id: 'camp-1',
        title: 'Follow Earnova Official on X',
        description: 'Follow @EarnovaApp on X (formerly Twitter) to stay informed on network releases.',
        category: 'twitter',
        platform: 'X',
        reward_cents: 4, // $0.04
        estimated_time: '1 min',
        action_url: 'https://x.com/earnova_official',
        verification_method: 'DWELL_TIMER',
        required_dwell_seconds: 15,
        current_completions: 980,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      'task-3': {
        id: 'task-3',
        campaign_id: 'camp-2',
        title: 'Join HyperSwap Global Community',
        description: 'Connect with 45k+ active traders in the official HyperSwap Telegram discussion group.',
        category: 'community',
        platform: 'Telegram',
        reward_cents: 6, // $0.06
        estimated_time: '1 min',
        action_url: 'https://t.me/hyperswap_dex',
        verification_method: 'TELEGRAM_CHANNEL',
        current_completions: 620,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      'task-4': {
        id: 'task-4',
        campaign_id: 'camp-2',
        title: 'Explore HyperSwap DEX Portal',
        description: 'Review features, liquidity pools, and read the introductory documentation on mobile.',
        category: 'sponsored',
        platform: 'Web',
        reward_cents: 3, // $0.03
        estimated_time: '45s',
        action_url: 'https://earnova.network/hyperswap',
        verification_method: 'DWELL_TIMER',
        required_dwell_seconds: 20,
        current_completions: 430,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      'task-5': {
        id: 'task-5',
        title: 'Retweet Earnova Genesis Launch',
        description: 'Like and repost the pinned Genesis launch post on X with the #Earnova hashtag.',
        category: 'twitter',
        platform: 'X',
        reward_cents: 5, // $0.05
        estimated_time: '1 min',
        action_url: 'https://x.com/earnova_official/status/genesis',
        verification_method: 'DWELL_TIMER',
        required_dwell_seconds: 15,
        current_completions: 890,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      'task-6': {
        id: 'task-6',
        title: 'Subscribe to Earnova YouTube Channel',
        description: 'Watch the 2-minute introductory guide on how to maximize your daily mining and rewards.',
        category: 'social',
        platform: 'YouTube',
        reward_cents: 4, // $0.04
        estimated_time: '2 mins',
        action_url: 'https://youtube.com/@earnova_official',
        verification_method: 'DWELL_TIMER',
        required_dwell_seconds: 25,
        current_completions: 512,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };

    const challenges: Record<string, Challenge> = {
      'chal-1': {
        id: 'chal-1',
        title: 'Task Trailblazer',
        description: 'Complete 5 promotional tasks across any partner campaigns.',
        requirement_type: 'TASKS_COMPLETED',
        requirement_target: 5,
        reward_cents: 25, // $0.25
        is_active: true,
      },
      'chal-2': {
        id: 'chal-2',
        title: 'Ambassador Initiate',
        description: 'Invite 3 active users who verify the channel and complete at least one task.',
        requirement_type: 'REFERRALS_QUALIFIED',
        requirement_target: 3,
        reward_cents: 100, // $1.00
        is_active: true,
      },
      'chal-3': {
        id: 'chal-3',
        title: 'Consistency Master',
        description: 'Maintain a 3-day active streak in Earnova.',
        requirement_type: 'STREAK_DAYS',
        requirement_target: 3,
        reward_cents: 50, // $0.50
        is_active: true,
      },
    };

    const prizePools: Record<string, PrizePool> = {
      'pool-1': {
        id: 'pool-1',
        name: 'Earnova Alpha Vault Prize Pool',
        prize_amount_cents: 25000, // $250.00
        winner_count: 10,
        start_date: new Date(Date.now() - 3 * 86400000).toISOString(),
        end_date: new Date(Date.now() + 5 * 86400000).toISOString(),
        eligibility_rule: 'Complete at least 3 tasks & keep channel verified',
        min_tasks_required: 3,
        status: 'ACTIVE',
        participant_count: 486,
      },
    };

    const announcements: Announcement[] = [
      {
        id: 'ann-1',
        title: 'Earnova Mining Speed Boost (2x)',
        content: 'All active mining sessions now receive double micro-cents accrual until the end of the week!',
        badge: 'Promo',
        action_label: 'Start Mining',
        action_url: 'mining',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ann-2',
        title: 'Instant USDT (TRC-20) Withdrawals Live',
        content: 'Automated batch processing for verified wallets is now activated with minimum $2.00 threshold.',
        badge: 'Update',
        action_label: 'View Wallet',
        action_url: 'wallet',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    return {
      users: {},
      wallets: {},
      transactions: [],
      campaigns,
      tasks,
      submissions: {},
      miningSessions: {},
      miningConfig: {
        enabled: true,
        rate_cents_per_minute: 0.001, // 0.001 cents ($0.00001) per min => ~$0.0048 per 8h
        duration_minutes: 480, // 8 hours
      },
      referrals: [],
      withdrawals: {},
      challenges,
      challengeProgress: {},
      prizePools,
      prizePoolEntries: [],
      announcements,
      fraudFlags: [],
    };
  }

  // --- USER AUTHENTICATION & MANAGEMENT ---
  public getOrCreateUser(telegramUser: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
    language_code?: string;
    start_param?: string;
  }): { user: User; wallet: Wallet; isNew: boolean } {
    let existingUser = Object.values(this.db.users).find((u) => u.telegram_id === telegramUser.id);
    let isNew = false;

    if (!existingUser) {
      isNew = true;
      const userId = crypto.randomUUID();
      const referralCode = `ERN${Math.floor(100000 + Math.random() * 900000)}`;

      // Check if referred by another user
      let referredById: string | undefined = undefined;
      if (telegramUser.start_param) {
        const refCode = telegramUser.start_param.trim().toUpperCase();
        const referrer = Object.values(this.db.users).find((u) => u.referral_code === refCode);
        if (referrer && referrer.telegram_id !== telegramUser.id) {
          referredById = referrer.id;
        }
      }

      existingUser = {
        id: userId,
        telegram_id: telegramUser.id,
        username: telegramUser.username || `user_${telegramUser.id}`,
        first_name: telegramUser.first_name || 'Earnova User',
        last_name: telegramUser.last_name || '',
        photo_url: telegramUser.photo_url || '',
        language_code: telegramUser.language_code || 'en',
        channel_verified: false,
        referred_by_id: referredById,
        referral_code: referralCode,
        is_suspended: false,
        streak_days: 1,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      this.db.users[userId] = existingUser;

      // Create ledger-controlled wallet
      const walletId = crypto.randomUUID();
      const wallet: Wallet = {
        id: walletId,
        user_id: userId,
        available_balance_cents: 0,
        pending_balance_cents: 0,
        total_earned_cents: 0,
        total_withdrawn_cents: 0,
        updated_at: new Date().toISOString(),
      };
      this.db.wallets[userId] = wallet;

      // If referred, create pending referral record
      if (referredById) {
        const referrer = this.db.users[referredById];
        if (referrer) {
          this.db.referrals.push({
            id: crypto.randomUUID(),
            referrer_id: referredById,
            referred_id: userId,
            referred_username: existingUser.username,
            referred_first_name: existingUser.first_name,
            is_qualified: false,
            reward_cents: 10, // $0.10 once qualified
            reward_paid: false,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Initialize default challenge progress
      Object.keys(this.db.challenges).forEach((chalId) => {
        const key = `${userId}_${chalId}`;
        this.db.challengeProgress[key] = {
          id: crypto.randomUUID(),
          challenge_id: chalId,
          user_id: userId,
          current_count: 0,
          is_completed: false,
          is_claimed: false,
        };
      });

      this.persistDatabase();
    } else {
      // Update activity & info
      existingUser.last_active_at = new Date().toISOString();
      if (telegramUser.username && telegramUser.username !== existingUser.username) {
        existingUser.username = telegramUser.username;
      }
      if (telegramUser.photo_url && telegramUser.photo_url !== existingUser.photo_url) {
        existingUser.photo_url = telegramUser.photo_url;
      }
    }

    const wallet = this.db.wallets[existingUser.id];
    return { user: existingUser, wallet, isNew };
  }

  public getUserById(userId: string): User | undefined {
    return this.db.users[userId];
  }

  public getUserByTelegramId(telegramId: number): User | undefined {
    return Object.values(this.db.users).find((u) => u.telegram_id === telegramId);
  }

  public setChannelVerified(userId: string, verified: boolean): User | undefined {
    const user = this.db.users[userId];
    if (!user) return undefined;

    user.channel_verified = verified;
    if (verified) {
      user.channel_verified_at = new Date().toISOString();
      // If user joined via referral, check if channel join triggers qualification
      this.evaluateReferralQualification(userId);
    }
    this.persistDatabase();
    return user;
  }

  // --- LEDGER & FINANCIAL TRANSACTIONS ---
  public creditWalletWithLedger(
    userId: string,
    amountCents: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    metadata?: Record<string, unknown>
  ): { wallet: Wallet; transaction: WalletTransaction } {
    if (amountCents <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const wallet = this.db.wallets[userId];
    if (!wallet) throw new Error('Wallet not found');

    wallet.available_balance_cents += amountCents;
    wallet.total_earned_cents += amountCents;
    wallet.updated_at = new Date().toISOString();

    const transaction: WalletTransaction = {
      id: crypto.randomUUID(),
      wallet_id: wallet.id,
      user_id: userId,
      amount_cents: amountCents,
      balance_after_cents: wallet.available_balance_cents,
      type,
      reference_id: referenceId,
      description,
      metadata,
      created_at: new Date().toISOString(),
    };

    this.db.transactions.unshift(transaction);
    this.persistDatabase();
    return { wallet, transaction };
  }

  public debitWalletForWithdrawal(
    userId: string,
    amountCents: number,
    feeCents: number,
    method: Withdrawal['method'],
    destinationAddress: string
  ): { withdrawal: Withdrawal; transaction: WalletTransaction } {
    const wallet = this.db.wallets[userId];
    const user = this.db.users[userId];
    if (!wallet || !user) throw new Error('Account not found');

    if (wallet.available_balance_cents < amountCents) {
      throw new Error('Insufficient balance');
    }

    wallet.available_balance_cents -= amountCents;
    wallet.pending_balance_cents += amountCents;
    wallet.updated_at = new Date().toISOString();

    const withdrawalId = crypto.randomUUID();
    const netAmountCents = amountCents - feeCents;

    const withdrawal: Withdrawal = {
      id: withdrawalId,
      user_id: userId,
      username: user.username,
      amount_cents: amountCents,
      fee_cents: feeCents,
      net_amount_cents: netAmountCents,
      method,
      destination_address: destinationAddress,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    this.db.withdrawals[withdrawalId] = withdrawal;

    const transaction: WalletTransaction = {
      id: crypto.randomUUID(),
      wallet_id: wallet.id,
      user_id: userId,
      amount_cents: -amountCents,
      balance_after_cents: wallet.available_balance_cents,
      type: 'WITHDRAWAL',
      reference_id: withdrawalId,
      description: `Withdrawal via ${method} (${destinationAddress.slice(0, 6)}...${destinationAddress.slice(-4)})`,
      metadata: { withdrawalId, method, feeCents },
      created_at: new Date().toISOString(),
    };

    this.db.transactions.unshift(transaction);
    this.persistDatabase();
    return { withdrawal, transaction };
  }

  public getWallet(userId: string): Wallet | undefined {
    return this.db.wallets[userId];
  }

  public getTransactions(userId: string, limit = 50): WalletTransaction[] {
    return this.db.transactions.filter((t) => t.user_id === userId).slice(0, limit);
  }

  // --- TASKS & SUBMISSIONS ---
  public getTasks(userId: string): Array<Task & { submissionStatus: Task['verification_method'] | string }> {
    return Object.values(this.db.tasks)
      .filter((t) => t.is_active)
      .map((t) => {
        const subKey = `${userId}_${t.id}`;
        const submission = this.db.submissions[subKey];
        return {
          ...t,
          submissionStatus: submission ? submission.status : 'AVAILABLE',
        };
      });
  }

  public startTask(userId: string, taskId: string): TaskSubmission {
    const task = this.db.tasks[taskId];
    if (!task) throw new Error('Task not found');

    const key = `${userId}_${taskId}`;
    const existing = this.db.submissions[key];
    if (existing && existing.status === 'COMPLETED') {
      throw new Error('Task already completed');
    }

    const submission: TaskSubmission = {
      id: existing ? existing.id : crypto.randomUUID(),
      task_id: taskId,
      user_id: userId,
      campaign_id: task.campaign_id,
      status: 'STARTED',
      reward_cents: task.reward_cents,
      verification_method: task.verification_method,
      started_at: new Date().toISOString(),
    };

    this.db.submissions[key] = submission;
    this.persistDatabase();
    return submission;
  }

  public submitAndVerifyTask(userId: string, taskId: string): { submission: TaskSubmission; rewardCents: number } {
    const task = this.db.tasks[taskId];
    if (!task) throw new Error('Task not found');

    const key = `${userId}_${taskId}`;
    const submission = this.db.submissions[key];

    // Anti-fraud / Idempotency checks
    if (!submission) {
      throw new Error('Task has not been started yet. Please tap Start Task.');
    }
    if (submission.status === 'COMPLETED') {
      throw new Error('Task reward has already been claimed.');
    }

    // Minimum dwell time verification for link / dwell tasks
    if (task.verification_method === 'DWELL_TIMER' && task.required_dwell_seconds) {
      const elapsedSeconds = (Date.now() - new Date(submission.started_at).getTime()) / 1000;
      if (elapsedSeconds < task.required_dwell_seconds - 1) {
        // Flag speed run attempt
        this.addFraudFlag(userId, 'SPEED_RUN', 'LOW', {
          taskId,
          required: task.required_dwell_seconds,
          elapsed: elapsedSeconds,
        });
        throw new Error(
          `Please engage with the task for at least ${task.required_dwell_seconds} seconds before verifying.`
        );
      }
    }

    // Check campaign budget if linked to sponsored campaign
    if (task.campaign_id) {
      const campaign = this.db.campaigns[task.campaign_id];
      if (campaign) {
        if (campaign.remaining_budget_cents < task.reward_cents) {
          throw new Error('Campaign budget cap reached.');
        }
        campaign.remaining_budget_cents -= task.reward_cents;
        campaign.current_completions += 1;
      }
    }

    // Approve submission
    submission.status = 'COMPLETED';
    submission.submitted_at = new Date().toISOString();
    submission.verified_at = new Date().toISOString();
    task.current_completions += 1;

    // Credit user's wallet with ledger entry
    this.creditWalletWithLedger(
      userId,
      task.reward_cents,
      'TASK_REWARD',
      `Completed task: ${task.title}`,
      task.id,
      { platform: task.platform, category: task.category }
    );

    // Update challenge progress: TASKS_COMPLETED
    this.incrementChallengeProgress(userId, 'TASKS_COMPLETED', 1);

    // Evaluate referral qualification for the inviter
    this.evaluateReferralQualification(userId);

    this.persistDatabase();
    return { submission, rewardCents: task.reward_cents };
  }

  // --- MINING ACCRUAL ENGINE (Time-based, Authoritative) ---
  public getMiningSession(userId: string): {
    session: MiningSession | null;
    ratePerMinute: number;
    durationMinutes: number;
    currentAccruedCents: number;
    timeRemainingSeconds: number;
    isEnabled: boolean;
  } {
    const isEnabled = this.db.miningConfig.enabled;
    const ratePerMinute = this.db.miningConfig.rate_cents_per_minute;
    const durationMinutes = this.db.miningConfig.duration_minutes;

    const activeSession = Object.values(this.db.miningSessions).find(
      (s) => s.user_id === userId && s.status === 'ACTIVE'
    );

    if (!activeSession) {
      return {
        session: null,
        ratePerMinute,
        durationMinutes,
        currentAccruedCents: 0,
        timeRemainingSeconds: 0,
        isEnabled,
      };
    }

    const now = Date.now();
    const startTime = new Date(activeSession.started_at).getTime();
    const endTime = new Date(activeSession.ends_at).getTime();

    const effectiveTime = Math.min(now, endTime);
    const elapsedMinutes = Math.max(0, (effectiveTime - startTime) / 60000);
    const accrued = elapsedMinutes * activeSession.rate_cents_per_minute;
    const timeRemainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

    return {
      session: activeSession,
      ratePerMinute: activeSession.rate_cents_per_minute,
      durationMinutes: activeSession.duration_minutes,
      currentAccruedCents: accrued,
      timeRemainingSeconds,
      isEnabled,
    };
  }

  public startMining(userId: string): MiningSession {
    if (!this.db.miningConfig.enabled) {
      throw new Error('Mining engine is currently undergoing maintenance.');
    }

    // Check if active session already exists
    const existing = Object.values(this.db.miningSessions).find((s) => s.user_id === userId && s.status === 'ACTIVE');
    if (existing) {
      throw new Error('A mining session is already in progress.');
    }

    const durationMinutes = this.db.miningConfig.duration_minutes;
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + durationMinutes * 60000);

    const session: MiningSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      rate_cents_per_minute: this.db.miningConfig.rate_cents_per_minute,
      duration_minutes: durationMinutes,
      claimed_cents: 0,
      status: 'ACTIVE',
    };

    this.db.miningSessions[session.id] = session;
    this.persistDatabase();
    return session;
  }

  public claimMining(userId: string): { session: MiningSession; claimedCents: number } {
    const activeSession = Object.values(this.db.miningSessions).find(
      (s) => s.user_id === userId && s.status === 'ACTIVE'
    );
    if (!activeSession) {
      throw new Error('No active mining session found to claim.');
    }

    const now = Date.now();
    const startTime = new Date(activeSession.started_at).getTime();
    const endTime = new Date(activeSession.ends_at).getTime();

    // Server-side authoritative timestamp calculation
    const effectiveTime = Math.min(now, endTime);
    const elapsedMinutes = Math.max(0, (effectiveTime - startTime) / 60000);

    if (elapsedMinutes < 1) {
      throw new Error('Session just started. Please wait at least 1 minute before claiming.');
    }

    const totalCalculatedCents = elapsedMinutes * activeSession.rate_cents_per_minute;
    // Round to 4 decimal micro-cents or minimum 0.01 cent threshold
    const claimAmountCents = Math.max(0.001, Number(totalCalculatedCents.toFixed(4)));

    activeSession.status = 'CLAIMED';
    activeSession.claimed_cents = claimAmountCents;
    activeSession.claimed_at = new Date().toISOString();

    // Ledger credit
    this.creditWalletWithLedger(
      userId,
      claimAmountCents,
      'MINING_REWARD',
      `Mining session yield (${elapsedMinutes.toFixed(1)} mins @ $${(activeSession.rate_cents_per_minute * 0.01).toFixed(5)}/min)`,
      activeSession.id
    );

    this.persistDatabase();
    return { session: activeSession, claimedCents: claimAmountCents };
  }

  // --- REFERRALS & QUALIFICATIONS ---
  public getReferralsData(userId: string): {
    referralCode: string;
    totalReferrals: number;
    activeReferrals: number;
    referralEarningsCents: number;
    referralsList: Referral[];
  } {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');

    const refs = this.db.referrals.filter((r) => r.referrer_id === userId);
    const activeRefs = refs.filter((r) => r.is_qualified);
    const earnings = refs.filter((r) => r.reward_paid).reduce((acc, curr) => acc + curr.reward_cents, 0);

    return {
      referralCode: user.referral_code,
      totalReferrals: refs.length,
      activeReferrals: activeRefs.length,
      referralEarningsCents: earnings,
      referralsList: refs,
    };
  }

  private evaluateReferralQualification(referredUserId: string): void {
    const referral = this.db.referrals.find((r) => r.referred_id === referredUserId);
    if (!referral || referral.is_qualified) return;

    const user = this.db.users[referredUserId];
    if (!user) return;

    // Check completed tasks count
    const completedTasks = Object.values(this.db.submissions).filter(
      (s) => s.user_id === referredUserId && s.status === 'COMPLETED'
    ).length;

    // Qualified if channel verified AND at least 1 task completed
    if (user.channel_verified && completedTasks >= 1) {
      referral.is_qualified = true;
      referral.qualified_at = new Date().toISOString();
      referral.qualification_reason = 'Channel verified & first promotional task completed';

      // Pay reward to referrer
      if (!referral.reward_paid) {
        referral.reward_paid = true;
        this.creditWalletWithLedger(
          referral.referrer_id,
          referral.reward_cents,
          'REFERRAL_REWARD',
          `Referral bonus: @${user.username} became active`,
          referral.id
        );
        // Increment challenge progress for referrer
        this.incrementChallengeProgress(referral.referrer_id, 'REFERRALS_QUALIFIED', 1);
      }
    }
  }

  // --- CHALLENGES ---
  public getChallengesWithProgress(userId: string): Array<Challenge & { progress: ChallengeProgress }> {
    return Object.values(this.db.challenges).map((chal) => {
      const key = `${userId}_${chal.id}`;
      let prog = this.db.challengeProgress[key];
      if (!prog) {
        prog = {
          id: crypto.randomUUID(),
          challenge_id: chal.id,
          user_id: userId,
          current_count: 0,
          is_completed: false,
          is_claimed: false,
        };
        this.db.challengeProgress[key] = prog;
      }
      return {
        ...chal,
        progress: prog,
      };
    });
  }

  public incrementChallengeProgress(userId: string, reqType: Challenge['requirement_type'], count = 1): void {
    Object.values(this.db.challenges)
      .filter((c) => c.requirement_type === reqType && c.is_active)
      .forEach((chal) => {
        const key = `${userId}_${chal.id}`;
        let prog = this.db.challengeProgress[key];
        if (!prog) {
          prog = {
            id: crypto.randomUUID(),
            challenge_id: chal.id,
            user_id: userId,
            current_count: 0,
            is_completed: false,
            is_claimed: false,
          };
          this.db.challengeProgress[key] = prog;
        }

        if (!prog.is_completed) {
          prog.current_count += count;
          if (prog.current_count >= chal.requirement_target) {
            prog.is_completed = true;
          }
        }
      });
  }

  public claimChallenge(userId: string, challengeId: string): ChallengeProgress {
    const chal = this.db.challenges[challengeId];
    if (!chal) throw new Error('Challenge not found');

    const key = `${userId}_${challengeId}`;
    const prog = this.db.challengeProgress[key];
    if (!prog || !prog.is_completed) {
      throw new Error('Challenge goal not yet accomplished');
    }
    if (prog.is_claimed) {
      throw new Error('Challenge reward already claimed');
    }

    prog.is_claimed = true;
    prog.claimed_at = new Date().toISOString();

    this.creditWalletWithLedger(
      userId,
      chal.reward_cents,
      'CHALLENGE_REWARD',
      `Challenge accomplishment: ${chal.title}`,
      chal.id
    );

    this.persistDatabase();
    return prog;
  }

  // --- PRIZE POOLS ---
  public getPrizePools(userId: string): Array<PrizePool & { isEntered: boolean }> {
    return Object.values(this.db.prizePools).map((pool) => {
      const entered = this.db.prizePoolEntries.some((e) => e.poolId === pool.id && e.userId === userId);
      return {
        ...pool,
        isEntered: entered,
      };
    });
  }

  public enterPrizePool(userId: string, poolId: string): boolean {
    const pool = this.db.prizePools[poolId];
    if (!pool || pool.status !== 'ACTIVE') throw new Error('Prize pool is not active');

    const alreadyEntered = this.db.prizePoolEntries.some((e) => e.poolId === poolId && e.userId === userId);
    if (alreadyEntered) return true;

    // Check user completed min tasks required
    const completedTasksCount = Object.values(this.db.submissions).filter(
      (s) => s.user_id === userId && s.status === 'COMPLETED'
    ).length;

    if (completedTasksCount < pool.min_tasks_required) {
      throw new Error(`You need to complete at least ${pool.min_tasks_required} tasks to qualify.`);
    }

    this.db.prizePoolEntries.push({
      id: crypto.randomUUID(),
      poolId,
      userId,
      createdAt: new Date().toISOString(),
    });
    pool.participant_count += 1;
    this.persistDatabase();
    return true;
  }

  // --- ANNOUNCEMENTS & LEADERBOARD ---
  public getAnnouncements(): Announcement[] {
    return this.db.announcements.filter((a) => a.is_active);
  }

  public getLeaderboard(): Array<{
    rank: number;
    username: string;
    totalEarnedCents: number;
    tasksCompleted: number;
    referralsCount: number;
  }> {
    // Generate ranking from users, masking privacy
    const users = Object.values(this.db.users);
    const ranked = users.map((u) => {
      const wallet = this.db.wallets[u.id];
      const tasksCompleted = Object.values(this.db.submissions).filter(
        (s) => s.user_id === u.id && s.status === 'COMPLETED'
      ).length;
      const referralsCount = this.db.referrals.filter((r) => r.referrer_id === u.id && r.is_qualified).length;

      // Privacy mask username
      const rawUser = u.username || `User${u.telegram_id}`;
      const masked = rawUser.length > 4 ? `${rawUser.slice(0, 3)}***${rawUser.slice(-1)}` : `${rawUser}***`;

      return {
        username: masked,
        totalEarnedCents: wallet ? wallet.total_earned_cents : 0,
        tasksCompleted,
        referralsCount,
      };
    });

    ranked.sort((a, b) => b.totalEarnedCents - a.totalEarnedCents);
    return ranked.slice(0, 20).map((r, i) => ({
      rank: i + 1,
      ...r,
    }));
  }

  // --- ANTI-FRAUD LOGGING ---
  public addFraudFlag(
    userId: string,
    flagType: string,
    severity: FraudFlag['severity'],
    details: Record<string, unknown>
  ): void {
    const flag: FraudFlag = {
      id: crypto.randomUUID(),
      user_id: userId,
      flag_type: flagType,
      severity,
      details,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };
    this.db.fraudFlags.unshift(flag);
    this.persistDatabase();
  }

  // --- ADMIN FUNCTIONS ---
  public getAdminStats(): {
    totalUsers: number;
    activeUsers: number;
    todayNewUsers: number;
    tasksCompleted: number;
    totalUserRewardsCents: number;
    totalWithdrawalsCents: number;
    pendingWithdrawalsCount: number;
    totalCampaignBudgetCents: number;
    totalPlatformMarginCents: number;
  } {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const users = Object.values(this.db.users);
    const totalUsers = users.length;
    const todayNewUsers = users.filter((u) => new Date(u.created_at).getTime() >= startOfToday).length;
    const activeUsers = users.filter(
      (u) => Date.now() - new Date(u.last_active_at).getTime() < 3 * 86400000
    ).length;

    const tasksCompleted = Object.values(this.db.submissions).filter((s) => s.status === 'COMPLETED').length;
    const totalUserRewardsCents = Object.values(this.db.wallets).reduce((a, b) => a + b.total_earned_cents, 0);

    const withdrawalsList = Object.values(this.db.withdrawals);
    const totalWithdrawalsCents = withdrawalsList
      .filter((w) => w.status === 'PAID')
      .reduce((a, b) => a + b.amount_cents, 0);
    const pendingWithdrawalsCount = withdrawalsList.filter((w) => w.status === 'PENDING').length;

    const campaignsList = Object.values(this.db.campaigns);
    const totalCampaignBudgetCents = campaignsList.reduce((a, b) => a + b.advertiser_budget_cents, 0);
    const totalPlatformMarginCents = campaignsList.reduce((a, b) => a + b.platform_revenue_cents, 0);

    return {
      totalUsers,
      activeUsers,
      todayNewUsers,
      tasksCompleted,
      totalUserRewardsCents,
      totalWithdrawalsCents,
      pendingWithdrawalsCount,
      totalCampaignBudgetCents,
      totalPlatformMarginCents,
    };
  }

  public getAllWithdrawals(): Withdrawal[] {
    return Object.values(this.db.withdrawals).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public processWithdrawal(
    withdrawalId: string,
    action: 'APPROVE' | 'PAID' | 'REJECT',
    note?: string
  ): Withdrawal {
    const withdrawal = this.db.withdrawals[withdrawalId];
    if (!withdrawal) throw new Error('Withdrawal request not found');

    const wallet = this.db.wallets[withdrawal.user_id];
    if (!wallet) throw new Error('Wallet not found');

    if (action === 'PAID') {
      withdrawal.status = 'PAID';
      withdrawal.processed_at = new Date().toISOString();
      withdrawal.admin_note = note || 'Processed and transferred via gateway';
      wallet.pending_balance_cents = Math.max(0, wallet.pending_balance_cents - withdrawal.amount_cents);
      wallet.total_withdrawn_cents += withdrawal.amount_cents;
    } else if (action === 'APPROVE') {
      withdrawal.status = 'PROCESSING';
      withdrawal.admin_note = note || 'Approved by compliance; awaiting batch payout';
    } else if (action === 'REJECT') {
      withdrawal.status = 'REJECTED';
      withdrawal.admin_note = note || 'Rejected due to account or destination issue';
      // Refund back to available balance!
      wallet.pending_balance_cents = Math.max(0, wallet.pending_balance_cents - withdrawal.amount_cents);
      wallet.available_balance_cents += withdrawal.amount_cents;

      // Add ledger transaction for refund
      const refundTx: WalletTransaction = {
        id: crypto.randomUUID(),
        wallet_id: wallet.id,
        user_id: withdrawal.user_id,
        amount_cents: withdrawal.amount_cents,
        balance_after_cents: wallet.available_balance_cents,
        type: 'WITHDRAWAL_REFUND',
        reference_id: withdrawal.id,
        description: `Refund for rejected withdrawal: ${note || 'Request rejected'}`,
        created_at: new Date().toISOString(),
      };
      this.db.transactions.unshift(refundTx);
    }

    this.persistDatabase();
    return withdrawal;
  }

  public createOrUpdateTask(taskData: Partial<Task>): Task {
    const taskId = taskData.id || `task-${Date.now()}`;
    const existing = this.db.tasks[taskId];

    const task: Task = {
      id: taskId,
      campaign_id: taskData.campaign_id || existing?.campaign_id,
      title: taskData.title || existing?.title || 'New Task',
      description: taskData.description || existing?.description || '',
      category: taskData.category || existing?.category || 'social',
      platform: taskData.platform || existing?.platform || 'Telegram',
      reward_cents: taskData.reward_cents !== undefined ? taskData.reward_cents : existing?.reward_cents || 5,
      estimated_time: taskData.estimated_time || existing?.estimated_time || '1 min',
      action_url: taskData.action_url || existing?.action_url || 'https://t.me/earnova_official',
      verification_method: taskData.verification_method || existing?.verification_method || 'DWELL_TIMER',
      required_dwell_seconds: taskData.required_dwell_seconds || 15,
      current_completions: existing?.current_completions || 0,
      is_active: taskData.is_active !== undefined ? taskData.is_active : true,
      created_at: existing?.created_at || new Date().toISOString(),
    };

    this.db.tasks[taskId] = task;
    this.persistDatabase();
    return task;
  }

  public updateMiningConfig(config: Partial<MiningConfig>): MiningConfig {
    this.db.miningConfig = {
      ...this.db.miningConfig,
      ...config,
    };
    this.persistDatabase();
    return this.db.miningConfig;
  }

  public createCampaign(campaignData: Omit<Campaign, 'id' | 'created_at' | 'current_completions' | 'remaining_budget_cents'>): Campaign {
    const id = `camp-${Date.now()}`;
    const campaign: Campaign = {
      ...campaignData,
      id,
      remaining_budget_cents: campaignData.advertiser_budget_cents,
      current_completions: 0,
      created_at: new Date().toISOString(),
    };
    this.db.campaigns[id] = campaign;
    this.persistDatabase();
    return campaign;
  }

  public getAllCampaigns(): Campaign[] {
    return Object.values(this.db.campaigns);
  }

  public toggleUserSuspension(userId: string, reason?: string): User {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');
    user.is_suspended = !user.is_suspended;
    user.suspension_reason = user.is_suspended ? reason || 'Suspicious automated activity detected' : undefined;
    this.persistDatabase();
    return user;
  }

  public getAllUsers(): User[] {
    return Object.values(this.db.users);
  }

  public getFraudFlags(): FraudFlag[] {
    return this.db.fraudFlags;
  }
}

export const storage = new Storage();
