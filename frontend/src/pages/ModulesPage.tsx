import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { ModuleList } from '@/components/ModuleList';
import { ProgressCard } from '@/components/ProgressCard';
import type { Module, Progress } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { BookOpen, TrendingUp, FlaskConical, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function ModulesPageSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
            <div className="h-5 skeleton rounded w-1/3 mb-2" />
            <div className="h-3 skeleton rounded w-1/2" />
          </div>
          <div className="p-6 space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="h-12 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type FilterType = 'all' | 'in_progress' | 'completed' | 'not_started';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Все',
  in_progress: 'Начатые',
  completed: 'Завершённые',
  not_started: 'Нужно сделать',
};

export default function ModulesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const isStudent = user?.role === 'student';

  const { data: modules, isLoading: modulesLoading, error: modulesError } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: progress } = useQuery<Progress>({
    queryKey: ['progress'],
    queryFn: async () => {
      const response = await api.get('/progress');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  if (modulesError) {
    return (
      <div className="card p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Не удалось загрузить модули</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Проверьте соединение и попробуйте снова</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Студент';
  const completedTopics = progress?.completed_topics ?? 0;
  const totalTopics = progress?.total_topics ?? 0;

  // Filter modules/topics for students
  const filteredModules = (modules || []).map((module) => {
    if (!isStudent || filter === 'all') return module;
    const moduleProgress = progress?.modules.find(m => m.id === module.id);
    const filteredTopics = module.topics.filter((topic) => {
      const topicProgress = moduleProgress?.topics?.find(t => t.id === topic.id);
      const status = topicProgress?.status ?? 'not_started';
      return status === filter;
    });
    return { ...module, topics: filteredTopics };
  }).filter(m => m.topics.length > 0);

  return (
    <div className="space-y-6">
      {/* Hero banner — only for students */}
      {isStudent && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-secondary p-6 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium">Электронный учебник</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">Привет, {firstName}! 👋</h1>
            <p className="text-blue-100 text-sm mb-4">
              {completedTopics === 0
                ? 'Начните изучение — выберите первый модуль'
                : `Вы прошли ${completedTopics} из ${totalTopics} тем. Продолжайте!`
              }
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 text-sm">
                <BookOpen className="w-4 h-4" />
                <span>{modules?.length ?? 0} модулей</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>{progress?.percentage ?? 0}% завершено</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Module list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Курсы</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Выберите тему для изучения</p>
              </div>
            </div>

            {/* Filter — only for students */}
            {isStudent && (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      filter === f
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {modulesLoading ? (
            <ModulesPageSkeleton />
          ) : (
            <ModuleList
              modules={filteredModules}
              progress={progress}
              onTopicClick={(topicId) => navigate(`/topic/${topicId}`)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="sticky top-24">
            {progress && <ProgressCard progress={progress} />}

            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
                Быстрые действия
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => navigate('/progress')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Моя статистика</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Графики и отчёты</div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/labs')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FlaskConical className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Мои лабораторные</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Загрузить работу</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
