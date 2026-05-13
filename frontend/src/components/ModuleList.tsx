import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, BookOpen } from 'lucide-react';
import type { Module, Progress } from '@/types';

interface ModuleListProps {
  modules: Module[];
  progress?: Progress;
  onTopicClick: (topicId: string) => void;
}

export function ModuleList({ modules, progress, onTopicClick }: ModuleListProps) {
  return (
    <div className="space-y-6">
      {modules.map((module) => (
        <div key={module.id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {module.title}
              </h2>
              {module.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {module.description}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {module.topics.length} тем
            </span>
          </div>

          <div className="space-y-2">
            {module.topics.map((topic, index) => {
              const moduleProgress = progress?.modules.find(m => m.id === module.id);
              const topicProgress = moduleProgress?.topics?.find(t => t.id === topic.id);
              const status = topicProgress?.status ?? 'not_started';

              return (
                <button
                  key={topic.id}
                  onClick={() => onTopicClick(topic.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                    status === 'in_progress' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                    status === 'not_started' && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  )}>
                    {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {status === 'in_progress' && <Clock className="w-4 h-4" />}
                    {status === 'not_started' && index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{topic.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {topic.has_test && <span>Тест</span>}
                      {topic.has_lab && <span>Лаба</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {modules.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Модули не найдены</p>
        </div>
      )}
    </div>
  );
}
