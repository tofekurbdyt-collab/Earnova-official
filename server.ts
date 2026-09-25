import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './src/server/storage.js';
import { verifyTelegramChannelMembership, validateTelegramInitData } from './src/server/telegram.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes prefix: /api
const router = express.Router();

// 1. Telegram Auth & User Initializer
router.post('/auth/telegram', async (req, res) => {
  try {
    const { initData, mockUser, startParam } = req.body;

    let telegramUser: {
      id: number;
      username?: string;
      first_name: string;
      last_name?: string;
      photo_url?: string;
      language_code?: string;
      start_param?: string;
    };

    if (initData) {
      const isValid = validateTelegramInitData(initData);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid Telegram WebApp authentication signature' });
      }
      const params = new URLSearchParams(initData);
      const userRaw = params.get('user');
      const start = params.get('start_param') || startParam;
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        telegramUser = {
          id: parsed.id,
          username: parsed.username,
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          photo_url: parsed.photo_url,
          language_code: parsed.language_code,
          start_param: start,
        };
      } else {
        return res.status(400).json({ error: 'Missing user object in initData' });
      }
    } else if (mockUser && mockUser.id) {
      telegramUser = {
        id: mockUser.id,
        username: mockUser.username || `tg_${mockUser.id}`,
        first_name: mockUser.first_name || 'Earnova Explorer',
        last_name: mockUser.last_name || '',
        photo_url: mockUser.photo_url || '',
        language_code: mockUser.language_code || 'en',
        start_param: startParam || mockUser.start_param,
      };
    } else {
      // Default demo account for browser preview
      telegramUser = {
        id: 74829103,
        username: 'earnova_pioneer',
        first_name: 'Alex',
        last_name: 'Novak',
        language_code: 'en',
        start_param: startParam,
      };
    }

    const { user, wallet, isNew } = storage.getOrCreateUser(telegramUser);
    return res.json({
      success: true,
      user,
      wallet,
      isNew,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Authentication failed';
    return res.status(500).json({ error: msg });
  }
});

// 2. Channel Verification Check
router.post('/channel/verify', async (req, res) => {
  try {
    const { userId, simulateJoin } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Call Telegram Bot API verification
    const verification = await verifyTelegramChannelMembership(user.telegram_id, simulateJoin);

    if (verification.verified) {
      const updatedUser = storage.setChannelVerified(userId, true);
      return res.json({
        success: true,
        verified: true,
        statusText: 'Verified',
        user: updatedUser,
        verification,
      });
    } else {
      return res.json({
        success: false,
        verified: false,
        statusText: verification.statusText,
        verification,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    return res.status(500).json({ error: msg });
  }
});

// 3. User Dashboard Data
router.get('/user/dashboard', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wallet = storage.getWallet(userId);
    const mining = storage.getMiningSession(userId);
    const announcements = storage.getAnnouncements();
    const tasks = storage.getTasks(userId);
    const completedTasksCount = tasks.filter((t) => t.submissionStatus === 'COMPLETED').length;

    // Calculate today's earnings from ledger
    const transactions = storage.getTransactions(userId, 100);
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const todayEarningsCents = transactions
      .filter((t) => t.amount_cents > 0 && new Date(t.created_at).getTime() >= startOfToday)
      .reduce((sum, t) => sum + t.amount_cents, 0);

    return res.json({
      user,
      wallet,
      mining,
      announcements,
      todayEarningsCents,
      completedTasksCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    return res.status(500).json({ error: msg });
  }
});

// 4. Tasks API
router.get('/tasks', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const tasks = storage.getTasks(userId);
    return res.json({ tasks });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch tasks';
    return res.status(500).json({ error: msg });
  }
});

router.post('/tasks/start', (req, res) => {
  try {
    const { userId, taskId } = req.body;
    if (!userId || !taskId) return res.status(400).json({ error: 'Missing userId or taskId' });

    const submission = storage.startTask(userId, taskId);
    return res.json({ success: true, submission });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start task';
    return res.status(400).json({ error: msg });
  }
});

router.post('/tasks/submit', (req, res) => {
  try {
    const { userId, taskId } = req.body;
    if (!userId || !taskId) return res.status(400).json({ error: 'Missing userId or taskId' });

    const result = storage.submitAndVerifyTask(userId, taskId);
    const updatedWallet = storage.getWallet(userId);
    return res.json({
      success: true,
      submission: result.submission,
      rewardCents: result.rewardCents,
      wallet: updatedWallet,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Task submission failed';
    return res.status(400).json({ error: msg });
  }
});

// 5. Mining Accrual API
router.get('/mining/status', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const mining = storage.getMiningSession(userId);
    return res.json(mining);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch mining status';
    return res.status(500).json({ error: msg });
  }
});

router.post('/mining/start', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const session = storage.startMining(userId);
    return res.json({ success: true, session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start mining';
    return res.status(400).json({ error: msg });
  }
});

router.post('/mining/claim', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const result = storage.claimMining(userId);
    const updatedWallet = storage.getWallet(userId);
    return res.json({
      success: true,
      session: result.session,
      claimedCents: result.claimedCents,
      wallet: updatedWallet,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Claim failed';
    return res.status(400).json({ error: msg });
  }
});

// 6. Referral API
router.get('/referrals', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const data = storage.getReferralsData(userId);
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch referrals';
    return res.status(500).json({ error: msg });
  }
});

// 7. Wallet & Ledger API
router.get('/wallet/transactions', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const transactions = storage.getTransactions(userId, 50);
    const wallet = storage.getWallet(userId);
    return res.json({ wallet, transactions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
    return res.status(500).json({ error: msg });
  }
});

router.post('/withdrawals/request', (req, res) => {
  try {
    const { userId, amountCents, method, destinationAddress } = req.body;
    if (!userId || !amountCents || !method || !destinationAddress) {
      return res.status(400).json({ error: 'Missing required withdrawal fields' });
    }

    // Minimum withdrawal check ($2.00 = 200 cents)
    const minWithdrawalCents = 200;
    if (amountCents < minWithdrawalCents) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is $${(minWithdrawalCents / 100).toFixed(2)}`,
      });
    }

    // Flat fee or 1%
    const feeCents = Math.max(5, Math.floor(amountCents * 0.01)); // $0.05 min fee or 1%

    const result = storage.debitWalletForWithdrawal(
      userId,
      amountCents,
      feeCents,
      method,
      destinationAddress.trim()
    );

    const updatedWallet = storage.getWallet(userId);
    return res.json({
      success: true,
      withdrawal: result.withdrawal,
      transaction: result.transaction,
      wallet: updatedWallet,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Withdrawal request failed';
    return res.status(400).json({ error: msg });
  }
});

// 8. Challenges & Prize Pools
router.get('/challenges', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const challenges = storage.getChallengesWithProgress(userId);
    return res.json({ challenges });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch challenges';
    return res.status(500).json({ error: msg });
  }
});

router.post('/challenges/claim', (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    if (!userId || !challengeId) return res.status(400).json({ error: 'Missing fields' });

    const progress = storage.claimChallenge(userId, challengeId);
    const updatedWallet = storage.getWallet(userId);
    return res.json({ success: true, progress, wallet: updatedWallet });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to claim challenge';
    return res.status(400).json({ error: msg });
  }
});

router.get('/prize-pools', (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    const pools = storage.getPrizePools(userId);
    return res.json({ pools });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch prize pools';
    return res.status(500).json({ error: msg });
  }
});

router.post('/prize-pools/enter', (req, res) => {
  try {
    const { userId, poolId } = req.body;
    if (!userId || !poolId) return res.status(400).json({ error: 'Missing fields' });

    storage.enterPrizePool(userId, poolId);
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to enter prize pool';
    return res.status(400).json({ error: msg });
  }
});

// 9. Leaderboard
router.get('/leaderboard', (_req, res) => {
  try {
    const leaderboard = storage.getLeaderboard();
    return res.json({ leaderboard });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
    return res.status(500).json({ error: msg });
  }
});

// 10. Announcements
router.get('/announcements', (_req, res) => {
  try {
    const announcements = storage.getAnnouncements();
    return res.json({ announcements });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch announcements';
    return res.status(500).json({ error: msg });
  }
});

// 11. ADMIN PANEL APIS
router.get('/admin/stats', (_req, res) => {
  try {
    const stats = storage.getAdminStats();
    return res.json(stats);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    return res.status(500).json({ error: msg });
  }
});

router.get('/admin/withdrawals', (_req, res) => {
  try {
    const withdrawals = storage.getAllWithdrawals();
    return res.json({ withdrawals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch withdrawals';
    return res.status(500).json({ error: msg });
  }
});

router.post('/admin/withdrawals/action', (req, res) => {
  try {
    const { withdrawalId, action, note } = req.body;
    if (!withdrawalId || !action) return res.status(400).json({ error: 'Missing fields' });

    const withdrawal = storage.processWithdrawal(withdrawalId, action, note);
    return res.json({ success: true, withdrawal });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Withdrawal action failed';
    return res.status(400).json({ error: msg });
  }
});

router.post('/admin/tasks', (req, res) => {
  try {
    const task = storage.createOrUpdateTask(req.body);
    return res.json({ success: true, task });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save task';
    return res.status(400).json({ error: msg });
  }
});

router.post('/admin/mining/config', (req, res) => {
  try {
    const config = storage.updateMiningConfig(req.body);
    return res.json({ success: true, config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update mining config';
    return res.status(400).json({ error: msg });
  }
});

router.get('/admin/campaigns', (_req, res) => {
  try {
    const campaigns = storage.getAllCampaigns();
    return res.json({ campaigns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch campaigns';
    return res.status(500).json({ error: msg });
  }
});

router.post('/admin/campaigns', (req, res) => {
  try {
    const campaign = storage.createCampaign(req.body);
    return res.json({ success: true, campaign });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create campaign';
    return res.status(400).json({ error: msg });
  }
});

router.get('/admin/users', (_req, res) => {
  try {
    const users = storage.getAllUsers();
    return res.json({ users });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch users';
    return res.status(500).json({ error: msg });
  }
});

router.post('/admin/users/toggle-suspend', (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = storage.toggleUserSuspension(userId, reason);
    return res.json({ success: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle suspension';
    return res.status(400).json({ error: msg });
  }
});

router.get('/admin/fraud-flags', (_req, res) => {
  try {
    const flags = storage.getFraudFlags();
    return res.json({ flags });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch fraud flags';
    return res.status(500).json({ error: msg });
  }
});

app.use('/api', router);

// Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Earnova full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
