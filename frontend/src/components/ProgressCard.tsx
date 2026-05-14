import { cn } from '@/lib/utils';
import type { Progress } from '@/types';
import { CheckCircle2, Clock, BookOpen, Award } from 'lucide-react';

interface ProgressCardProps {
  progress: Progress;
}

const MODULE_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
];

export function ProgressCard({ progress }: ProgressCardProps) {
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Мой прогресс
        </h3>
      </div>

      {/* Circle progress */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-100 dark:text-gray-700"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {progress.percentage}%
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">завершено</span>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                {progress.completed_topics}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">завершено</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                {progress.in_progress_topics}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">в процессе</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                {progress.total_topics}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">всего тем</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module progress bars */}
      {progress.modules.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-gray-100 dark:bg-gray-700" />
          {progress.modules.map((module, index) => {
            const percent = module.total_topics > 0
              ? Math.round((module.completed_topics / module.total_topics) * 100)
              : 0;
            const gradient = MODULE_COLORS[index % MODULE_COLORS.length];

            return (
              <div key={module.id} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate pr-2">
                    {module.title}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {module.completed_topics}/{module.total_topics}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full bg-gradient-to-r transition-all duration-700',
                      gradient
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
