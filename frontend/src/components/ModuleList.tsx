import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, BookOpen, FlaskConical, HelpCircle, ChevronRight } from 'lucide-react';
import type { Module, Progress } from '@/types';

interface ModuleListProps {
  modules: Module[];
  progress?: Progress;
  onTopicClick: (topicId: string) => void;
}

const MODULE_GRADIENTS = [
  { from: 'from-blue-500', to: 'to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/50', text: 'text-blue-600 dark:text-blue-400', num: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { from: 'from-violet-500', to: 'to-purple-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-100 dark:border-violet-900/50', text: 'text-violet-600 dark:text-violet-400', num: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { from: 'from-emerald-500', to: 'to-teal-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400', num: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { from: 'from-orange-500', to: 'to-amber-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-100 dark:border-orange-900/50', text: 'text-orange-600 dark:text-orange-400', num: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  { from: 'from-rose-500', to: 'to-pink-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-100 dark:border-rose-900/50', text: 'text-rose-600 dark:text-rose-400', num: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'in_progress') return <Clock className="w-4 h-4 text-amber-500" />;
  return null;
}

export function ModuleList({ modules, progress, onTopicClick }: ModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="card p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Модули не найдены</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Курсы пока не добавлены</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {modules.map((module, moduleIndex) => {
        const color = MODULE_GRADIENTS[moduleIndex % MODULE_GRADIENTS.length];
        const moduleProgress = progress?.modules.find(m => m.id === module.id);
        const completedCount = moduleProgress?.completed_topics ?? 0;
        const totalCount = module.topics.length;
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <div key={module.id} className="card overflow-hidden">
            {/* Module header */}
            <div className={cn('px-6 py-4', color.bg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', color.from, color.to)}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {module.title}
                    </h2>
                    {module.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {module.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className={cn('text-sm font-bold', color.text)}>
                    {completedCount}/{totalCount}
                  </div>
                  <div className="text-xs text-gray-400">завершено</div>
                </div>
              </div>

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-white/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', color.from, color.to)}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Topics */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {module.topics.map((topic, topicIndex) => {
                const topicProgress = moduleProgress?.topics?.find(t => t.id === topic.id);
                const status = topicProgress?.status ?? 'not_started';

                return (
                  <button
                    key={topic.id}
                    onClick={() => onTopicClick(topic.id)}
                    className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 group"
                  >
                    {/* Number / status */}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all',
                      status === 'completed' && 'bg-emerald-100 dark:bg-emerald-900/30',
                      status === 'in_progress' && 'bg-amber-100 dark:bg-amber-900/30',
                      status === 'not_started' && color.num,
                    )}>
                      {status === 'completed'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : status === 'in_progress'
                        ? <Clock className="w-4 h-4 text-amber-500" />
                        : <span className={color.text}>{topicIndex + 1}</span>
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm font-medium truncate',
                        status === 'completed' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                      )}>
                        {topic.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {topic.has_test && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                            <HelpCircle className="w-3 h-3" /> Тест
                          </span>
                        )}
                        {topic.has_lab && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                            <FlaskConical className="w-3 h-3" /> Лаба
                          </span>
                        )}
                        {topicProgress?.best_score !== undefined && topicProgress.best_score !== null && (
                          <span className="text-xs text-emerald-500 font-medium">
                            {topicProgress.best_score}%
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
