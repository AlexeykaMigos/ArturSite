import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import type { Module } from '@/types';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function TeacherContentPage() {
  const navigate = useNavigate();

  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Управление контентом</h1>
            <p className="text-gray-500 dark:text-gray-400">Модули и темы курса</p>
          </div>
        </div>
        <Button onClick={() => navigate('/teacher/content/module/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить модуль
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : modules && modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{module.title}</h2>
                  {module.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/content/module/${module.id}/edit`)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {module.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-6">{topic.order + 1}.</span>
                      <span className="text-gray-900 dark:text-gray-100">{topic.title}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {topic.has_test && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Тест</span>}
                        {topic.has_lab && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">Лаба</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/content/topic/${topic.id}/edit`)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/teacher/content/topic/new?module_id=${module.id}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить тему
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Модули не найдены</p>
          <Button className="mt-4" onClick={() => navigate('/teacher/content/module/new')}>
            Создать первый модуль
          </Button>
        </div>
      )}
    </div>
  );
}