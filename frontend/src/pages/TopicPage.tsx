import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cn, formatTime } from '@/lib/utils';
import { ArrowLeft, ArrowRight, FileText, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import type { TopicWithProgress, Lab } from '@/types';
import { useState, useEffect } from 'react';
import { CommentsSection } from '@/components/CommentsSection';

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [showLabUpload, setShowLabUpload] = useState(false);

  const { data: topic, isLoading } = useQuery<TopicWithProgress>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/with-progress`);
      return response.data;
    },
  });

  const { data: lab } = useQuery<Lab>({
    queryKey: ['lab', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/lab`);
      return response.data;
    },
    enabled: !!topic?.has_lab,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Тема не найдена</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button onClick={() => navigate('/modules')} className="hover:text-primary">
          Модули
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">{topic.title}</span>
      </div>

      <div className="card p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {topic.title}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              {topic.has_test && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <HelpCircle className="w-4 h-4" /> Тест доступен
                </span>
              )}
              {topic.has_lab && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <FileText className="w-4 h-4" /> Лабораторная работа
                </span>
              )}
              <span className={cn(
                'flex items-center gap-1',
                topic.progress_status === 'completed' && 'text-green-600',
                topic.progress_status === 'in_progress' && 'text-yellow-600',
                topic.progress_status === 'not_started' && 'text-gray-400'
              )}>
                {topic.progress_status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                {topic.progress_status === 'in_progress' && <Clock className="w-4 h-4" />}
                {topic.progress_status === 'completed' && 'Завершена'}
                {topic.progress_status === 'in_progress' && 'В процессе'}
                {topic.progress_status === 'not_started' && 'Не начата'}
              </span>
            </div>
          </div>
          {topic.best_score !== null && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{topic.best_score}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Лучший результат</div>
            </div>
          )}
        </div>

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: topic.content }}
        />

        {topic.has_test && (
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Тестирование</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Проверьте свои знания, пройдя тест. Для завершения темы необходимо набрать минимум {topic.passing_score}% правильных ответов.
            </p>
            <Button onClick={() => navigate(`/topic/${topicId}/test`)}>
              Пройти тест
            </Button>
          </div>
        )}

        {lab && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {lab.title}
            </h3>
            <div
              className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: lab.description }}
            />
            {lab.requirements && lab.requirements.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Требования:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {lab.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setShowLabUpload(true)}>
                Загрузить работу
              </Button>
            </div>
          </div>
        )}
      </div>

      <CommentsSection topicId={topicId || ''} />

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        {topic.has_test && (
          <Button onClick={() => navigate(`/topic/${topicId}/test`)}>
            К тесту
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}