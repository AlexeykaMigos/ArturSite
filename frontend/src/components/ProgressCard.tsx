import { cn } from '@/lib/utils';
import type { Progress } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface ProgressCardProps {
  progress: Progress;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Общий прогресс
      </h3>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${progress.percentage * 3.52} 352`}
              strokeLinecap="round"
              className="text-green-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {progress.percentage}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Завершено: <strong>{progress.completed_topics}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              В процессе: <strong>{progress.in_progress_topics}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Всего тем: <strong>{progress.total_topics}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {progress.modules.map((module) => {
          const percent = module.total_topics > 0
            ? Math.round((module.completed_topics / module.total_topics) * 100)
            : 0;

          return (
            <div key={module.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{module.title}</span>
                <span className="text-gray-500 dark:text-gray-400">{percent}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    percent === 100 ? 'bg-green-500' : 'bg-primary'
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}