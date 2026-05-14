import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { ModuleList } from '@/components/ModuleList';
import { ProgressCard } from '@/components/ProgressCard';
import type { Module, Progress } from '@/types';
import { BookOpen, TrendingUp } from 'lucide-react';

export default function ModulesPage() {
  const navigate = useNavigate();

  const { data: modules, isLoading: modulesLoading, error: modulesError } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: progress, error: progressError } = useQuery<Progress>({
    queryKey: ['progress'],
    queryFn: async () => {
      const response = await api.get('/progress');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (modulesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (modulesError) {
    return (
      <div className="card p-12 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">Ошибка загрузки модулей</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Модули курса</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Выберите тему для изучения
            </p>
          </div>
        </div>

        <ModuleList
          modules={modules || []}
          progress={progress}
          onTopicClick={(topicId) => navigate(`/topic/${topicId}`)}
        />
      </div>

      <div>
        <div className="sticky top-24">
          {progress && <ProgressCard progress={progress} />}

          <div className="card p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Быстрые действия</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/progress')}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">Моя статистика</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Подробный отчёт</div>
              </button>
              <button
                onClick={() => navigate('/labs')}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">Мои лабораторные</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Загрузить работу</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
