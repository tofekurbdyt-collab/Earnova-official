import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, Wallet } from '../types/index.js';
import { api, formatUSD } from '../lib/api.js';
import { openExternalUrl, triggerHaptic } from '../lib/telegram.js';

interface Props {
  userId: string;
  onWalletUpdated: (wallet: Wallet) => void;
}

export const TasksPage: React.FC<Props> = ({ userId, onWalletUpdated }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDwellTasks, setActiveDwellTasks] = useState<Record<string, number>>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'telegram', label: 'Telegram' },
    { id: 'twitter', label: 'Twitter / X' },
    { id: 'community', label: 'Community' },
    { id: 'sponsored', label: 'Sponsored' },
    { id: 'social', label: 'Social' },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks(userId);
      setTasks(data);
    } catch {
      setErrorMessage('Could not load tasks list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  // Tick down dwell timers
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDwellTasks((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((taskId) => {
          if (next[taskId] > 0) {
            next[taskId] -= 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStartTask = async (task: Task) => {
    triggerHaptic('medium');
    setErrorMessage(null);

    try {
      await api.startTask(userId, task.id);
      openExternalUrl(task.action_url);

      const dwellTime = task.required_dwell_seconds || 15;
      setActiveDwellTasks((prev) => ({ ...prev, [task.id]: dwellTime }));

      // Update task status in UI
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, submissionStatus: 'STARTED' } : t))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start task';
      setErrorMessage(msg);
    }
  };

  const handleVerifyTask = async (task: Task) => {
    triggerHaptic('heavy');
    setSubmittingTaskId(task.id);
    setErrorMessage(null);

    try {
      const res = await api.submitTask(userId, task.id);
      if (res.success) {
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        // Update task status
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, submissionStatus: 'COMPLETED' } : t))
        );

        if (res.wallet) {
          onWalletUpdated(res.wallet);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setErrorMessage(msg);
      triggerHaptic('error');
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Earnova Tasks</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            USD Rewards
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete legitimate sponsor and community missions to earn instant verified balances.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Horizontal Category Segmented Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory(cat.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading active campaigns...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 px-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
          <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">No tasks in this category</h3>
          <p className="text-xs text-slate-400">
            Check back shortly for new partner promotional tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isCompleted = task.submissionStatus === 'COMPLETED';
            const isStarted = task.submissionStatus === 'STARTED';
            const dwellSecondsLeft = activeDwellTasks[task.id] || 0;
            const canVerify = isStarted && dwellSecondsLeft === 0;
            const isSubmitting = submittingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {task.platform}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">·</span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_time}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{task.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 text-right">
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 font-extrabold text-xs tabular-nums">
                      +{formatUSD(task.reward_cents)}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                    <span>Server-authoritative</span>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  ) : canVerify ? (
                    <button
                      onClick={() => handleVerifyTask(task)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 active:scale-95 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim Reward</span>
                        </>
                      )}
                    </button>
                  ) : isStarted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-900/40">
                        Wait {dwellSecondsLeft}s
                      </span>
                      <button
                        onClick={() => openExternalUrl(task.action_url)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:text-white"
                      >
                        Re-open
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartTask(task)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30 active:scale-95 transition-all"
                    >
                      <span>Start Task</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
