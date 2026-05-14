import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import type { Topic, Module, Lab, LabTask } from '@/types';
import { useState } from 'react';

export default function TopicEditPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(0);
  const [hasTest, setHasTest] = useState(false);
  const [hasLab, setHasLab] = useState(false);
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(15);
  const [labTasks, setLabTasks] = useState<Array<{ id?: string; title: string; description: string; order: number; max_score: number }>>([]);

  const { data: topic, isLoading } = useQuery<Topic>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}`);
      return response.data;
    },
    onSuccess: (data) => {
      setTitle(data.title);
      setContent(data.content || '');
      setOrder(data.order || 0);
      setHasTest(data.has_test || false);
      setHasLab(data.has_lab || false);
      setPassingScore(data.passing_score || 70);
      setTimeLimit(data.time_limit || 15);
    },
    enabled: !!topicId,
  });

  const { data: lab } = useQuery<Lab>({
    queryKey: ['lab', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/lab`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.tasks && data.tasks.length > 0) {
        setLabTasks(data.tasks);
      }
    },
    enabled: !!topicId && !!topic?.has_lab,
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data;
    },
  });

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    searchParams.get('module_id') || ''
  );

  const updateMutation = useMutation({
    mutationFn: async (data: {
      module_id?: string;
      title: string;
      content: string;
      order: number;
      has_test: boolean;
      has_lab: boolean;
      passing_score: number;
      time_limit: number;
    }) => {
      const response = await api.put(`/topics/${topicId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      navigate('/teacher/content');
    },
  });

  const addLabTask = () => {
    const newOrder = labTasks.length + 1;
    setLabTasks([...labTasks, { title: '', description: '', order: newOrder, max_score: 10 }]);
  };

  const removeLabTask = (index: number) => {
    const newTasks = labTasks.filter((_, i) => i !== index);
    // Reorder tasks
    newTasks.forEach((task, i) => task.order = i + 1);
    setLabTasks(newTasks);
  };

  const updateLabTask = (index: number, field: string, value: string | number) => {
    const newTasks = [...labTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setLabTasks(newTasks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      module_id: selectedModuleId,
      title,
      content,
      order,
      has_test: hasTest,
      has_lab: hasLab,
      passing_score: passingScore,
      time_limit: timeLimit,
      lab_tasks: hasLab ? labTasks : [],
    });
  };

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
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <button onClick={() => navigate('/teacher/content')} className="hover:text-primary">
          Управление контентом
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Редактирование темы</span>
      </div>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Редактирование темы</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Модуль
            </label>
            <select
              value={selectedModuleId || topic.module_id}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {modules?.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Содержание (HTML)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              placeholder="Вы можете использовать HTML теги для форматирования"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Порядок
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Проходной балл (%)
              </label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Лимит времени (минуты)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_test"
                checked={hasTest}
                onChange={(e) => setHasTest(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="has_test" className="text-sm text-gray-700 dark:text-gray-300">
                Включить тест
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_lab"
                checked={hasLab}
                onChange={(e) => setHasLab(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="has_lab" className="text-sm text-gray-700 dark:text-gray-300">
                Включить лабораторную работу
              </label>
            </div>
          </div>

          {hasLab && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Задачи лабораторной работы</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addLabTask}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить задачу
                </Button>
              </div>

              {labTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Нет задач. Нажмите "Добавить задачу" для создания.
                </p>
              ) : (
                <div className="space-y-3">
                  {labTasks.map((task, index) => (
                    <div key={task.id || index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Задача {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLabTask(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Название
                          </label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateLabTask(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Название задачи"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Описание
                          </label>
                          <textarea
                            value={task.description}
                            onChange={(e) => updateLabTask(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Описание задачи"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Порядок
                            </label>
                            <input
                              type="number"
                              value={task.order}
                              onChange={(e) => updateLabTask(index, 'order', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              min={1}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Баллы
                            </label>
                            <input
                              type="number"
                              value={task.max_score}
                              onChange={(e) => updateLabTask(index, 'max_score', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/teacher/content')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
