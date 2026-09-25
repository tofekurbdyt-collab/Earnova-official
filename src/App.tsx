import React, { useState, useEffect } from 'react';
import {
  User,
  Wallet,
  MiningData,
  Announcement,
  TabType,
} from './types/index.js';
import { api } from './lib/api.js';
import { initTelegramWebApp, getTelegramWebApp } from './lib/telegram.js';
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { HomePage } from './components/HomePage.js';
import { TasksPage } from './components/TasksPage.js';
import { MiningPage } from './components/MiningPage.js';
import { WalletPage } from './components/WalletPage.js';
import { ProfilePage } from './components/ProfilePage.js';
import { ChannelVerificationModal } from './components/ChannelVerificationModal.js';
import { WithdrawalModal } from './components/WithdrawalModal.js';
import { ReferralsModal } from './components/ReferralsModal.js';
import { ChallengesModal } from './components/ChallengesModal.js';
import { PrizePoolModal } from './components/PrizePoolModal.js';
import { LeaderboardModal } from './components/LeaderboardModal.js';
import { NotificationsModal } from './components/NotificationsModal.js';
import { AdminPanelModal } from './components/AdminPanelModal.js';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [miningData, setMiningData] = useState<MiningData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayEarningsCents, setTodayEarningsCents] = useState<number>(0);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [loadingApp, setLoadingApp] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);
  const [showReferralsModal, setShowReferralsModal] = useState<boolean>(false);
  const [showChallengesModal, setShowChallengesModal] = useState<boolean>(false);
  const [showPrizePoolModal, setShowPrizePoolModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [forcedChannelGate, setForcedChannelGate] = useState<boolean>(false);

  // Initialize app & Telegram authentication
  const initializeAuth = async (mockUserParam?: { id: number; username: string; first_name: string }) => {
    try {
      setLoadingApp(true);
      setAuthError(null);
      initTelegramWebApp();

      const tg = getTelegramWebApp();
      const initData = tg?.initData;
      const startParam = tg?.initDataUnsafe?.start_param;

      const authRes = await api.authenticate(initData, mockUserParam);
      setCurrentUser(authRes.user);
      setWallet(authRes.wallet);

      // Fetch fresh dashboard data
      if (authRes.user) {
        const dash = await api.getDashboard(authRes.user.id);
        setWallet(dash.wallet);
        setMiningData(dash.mining);
        setAnnouncements(dash.announcements || []);
        setTodayEarningsCents(dash.todayEarningsCents || 0);
        setCompletedTasksCount(dash.completedTasksCount || 0);
      }
    } catch (err: unknown) {
      console.error('Initialization error:', err);
      const msg = err instanceof Error ? err.message : 'Could not authenticate';
      setAuthError(msg);
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const refreshWalletAndDashboard = async () => {
    if (!currentUser) return;
    try {
      const dash = await api.getDashboard(currentUser.id);
      setWallet(dash.wallet);
      setMiningData(dash.mining);
      setTodayEarningsCents(dash.todayEarningsCents || 0);
      setCompletedTasksCount(dash.completedTasksCount || 0);
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
        <div className="text-base font-bold text-white tracking-tight">Earnova</div>
        <div className="text-xs text-slate-400 mt-1">Authenticating Telegram Mini App...</div>
      </div>
    );
  }

  if (authError || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Authentication Error</h2>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">{authError || 'Failed to load session'}</p>
        <button
          onClick={() => initializeAuth()}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // MANDATORY CHANNEL VERIFICATION GATE:
  // If user is not channel verified, keep app locked behind mandatory verification modal!
  const isChannelLocked = !currentUser.channel_verified || forcedChannelGate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top App Bar Header */}
      <Header
        user={currentUser}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        hasUnreadAnnouncements={announcements.length > 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 overflow-x-hidden">
        {activeTab === 'home' && (
          <HomePage
            user={currentUser}
            wallet={wallet}
            mining={miningData}
            announcements={announcements}
            todayEarningsCents={todayEarningsCents}
            completedTasksCount={completedTasksCount}
            onNavigateTab={(t) => setActiveTab(t)}
            onOpenWithdraw={() => setShowWithdrawalModal(true)}
            onOpenReferrals={() => setShowReferralsModal(true)}
            onOpenChallenges={() => setShowChallengesModal(true)}
            onOpenPrizePool={() => setShowPrizePoolModal(true)}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksPage
            userId={currentUser.id}
            onWalletUpdated={(w) => {
              setWallet(w);
              refreshWalletAndDashboard();
            }}
          />
        )}

        {activeTab === 'mining' && (
          <MiningPage
            userId={currentUser.id}
            miningData={miningData}
            onMiningUpdated={(d) => setMiningData(d)}
            onWalletUpdated={(w) => {
              setWallet(w);
              refreshWalletAndDashboard();
            }}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletPage
            userId={currentUser.id}
            wallet={wallet}
            onOpenWithdraw={() => setShowWithdrawalModal(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={currentUser}
            wallet={wallet}
            completedTasksCount={completedTasksCount}
            onOpenReferrals={() => setShowReferralsModal(true)}
            onOpenChallenges={() => setShowChallengesModal(true)}
            onOpenPrizePool={() => setShowPrizePoolModal(true)}
            onOpenLeaderboard={() => setShowLeaderboardModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenAdmin={() => setShowAdminModal(true)}
            onSwitchUser={(mockUser) => initializeAuth(mockUser)}
            onReverifyChannel={() => setForcedChannelGate(true)}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        miningActive={Boolean(miningData?.session && miningData.session.status === 'ACTIVE')}
      />

      {/* Mandatory Channel Verification Lock Screen */}
      {isChannelLocked && (
        <ChannelVerificationModal
          user={currentUser}
          onVerified={(updatedUser) => {
            setCurrentUser(updatedUser);
            setForcedChannelGate(false);
            refreshWalletAndDashboard();
          }}
        />
      )}

      {/* Modals & Dialogs */}
      {showWithdrawalModal && (
        <WithdrawalModal
          userId={currentUser.id}
          wallet={wallet}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={(w) => {
            setWallet(w);
            setShowWithdrawalModal(false);
            refreshWalletAndDashboard();
          }}
        />
      )}

      {showReferralsModal && (
        <ReferralsModal
          userId={currentUser.id}
          onClose={() => setShowReferralsModal(false)}
        />
      )}

      {showChallengesModal && (
        <ChallengesModal
          userId={currentUser.id}
          onClose={() => setShowChallengesModal(false)}
          onWalletUpdated={(w) => {
            setWallet(w);
            refreshWalletAndDashboard();
          }}
        />
      )}

      {showPrizePoolModal && (
        <PrizePoolModal
          userId={currentUser.id}
          onClose={() => setShowPrizePoolModal(false)}
        />
      )}

      {showLeaderboardModal && (
        <LeaderboardModal
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {showNotificationsModal && (
        <NotificationsModal
          announcements={announcements}
          onClose={() => setShowNotificationsModal(false)}
          onNavigateTab={(tab) => {
            if (['home', 'tasks', 'mining', 'wallet', 'profile'].includes(tab)) {
              setActiveTab(tab as TabType);
            }
          }}
        />
      )}

      {showAdminModal && (
        <AdminPanelModal
          onClose={() => {
            setShowAdminModal(false);
            refreshWalletAndDashboard();
          }}
        />
      )}
    </div>
  );
}
