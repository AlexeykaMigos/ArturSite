import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import type { Topic, Module, Lab } from '@/types';
import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

interface MatchingPair {
  term: string;
  definition: string;
}

interface TestQuestion {
  id: string;
  type: 'single' | 'multiple' | 'matching' | 'text';
  text: string;
  options?: QuestionOption[];
  matching_pairs?: MatchingPair[];
  correct_keywords?: string[];
}

interface FullTest {
  id: string;
  topic_id: string;
  questions: TestQuestion[];
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function newOption(correct = false): QuestionOption {
  return { id: generateId(), text: '', is_correct: correct };
}

function newQuestion(type: TestQuestion['type'] = 'single'): TestQuestion {
  const base = { id: generateId(), type, text: '' };
  if (type === 'single' || type === 'multiple') {
    return { ...base, options: [newOption(), newOption()] };
  }
  if (type === 'matching') {
    return { ...base, matching_pairs: [{ term: '', definition: '' }] };
  }
  return { ...base, correct_keywords: [''] };
}

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
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    searchParams.get('module_id') || ''
  );
  const [labTasks, setLabTasks] = useState<Array<{ id?: string; title: string; description: string; order: number; max_score: number }>>([]);

  // Test state
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const { data: topic, isLoading } = useQuery<Topic>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}`);
      return response.data;
    },
    enabled: !!topicId,
  });

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setContent(topic.content || '');
      setOrder(topic.order || 0);
      setHasTest(topic.has_test || false);
      setHasLab(topic.has_lab || false);
      setPassingScore(topic.passing_score || 70);
      setTimeLimit(topic.time_limit || 15);
      if (!selectedModuleId) {
        setSelectedModuleId(topic.module_id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const { data: lab } = useQuery<Lab>({
    queryKey: ['lab', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/lab`);
      return response.data;
    },
    enabled: !!topicId && !!topic?.has_lab,
  });

  useEffect(() => {
    if (lab?.tasks && lab.tasks.length > 0) {
      setLabTasks(lab.tasks);
    }
  }, [lab]);

  const { data: testData } = useQuery<FullTest>({
    queryKey: ['test-full', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/test/full`);
      return response.data;
    },
    enabled: !!topicId && !!topic?.has_test,
  });

  useEffect(() => {
    if (testData) {
      setQuestions(testData.questions || []);
      setShuffleQuestions(testData.shuffle_questions || false);
      setShuffleOptions(testData.shuffle_options ?? true);
    }
  }, [testData]);

  const { data: modules } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.put(`/topics/${topicId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      navigate('/teacher/content');
    },
  });

  const saveTestMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.put(`/topics/${topicId}/test`, data);
      return response.data;
    },
  });

  // Lab task helpers
  const addLabTask = () => {
    setLabTasks([...labTasks, { title: '', description: '', order: labTasks.length + 1, max_score: 10 }]);
  };

  const removeLabTask = (index: number) => {
    const newTasks = labTasks.filter((_, i) => i !== index);
    newTasks.forEach((task, i) => { task.order = i + 1; });
    setLabTasks(newTasks);
  };

  const updateLabTask = (index: number, field: string, value: string | number) => {
    const newTasks = [...labTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setLabTasks(newTasks);
  };

  // Question helpers
  const addQuestion = () => {
    setQuestions([...questions, newQuestion('single')]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const changeQuestionType = (index: number, type: TestQuestion['type']) => {
    const q = questions[index];
    const base = { id: q.id, text: q.text, type };
    let updated: TestQuestion;
    if (type === 'single' || type === 'multiple') {
      updated = { ...base, options: q.options?.length ? q.options : [newOption(), newOption()] };
    } else if (type === 'matching') {
      updated = { ...base, matching_pairs: q.matching_pairs?.length ? q.matching_pairs : [{ term: '', definition: '' }] };
    } else {
      updated = { ...base, correct_keywords: q.correct_keywords?.length ? q.correct_keywords : [''] };
    }
    const all = [...questions];
    all[index] = updated;
    setQuestions(all);
  };

  // Option helpers
  const addOption = (qIndex: number) => {
    const q = { ...questions[qIndex] };
    q.options = [...(q.options || []), newOption()];
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = { ...questions[qIndex] };
    q.options = (q.options || []).filter((_, i) => i !== oIndex);
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const updateOption = (qIndex: number, oIndex: number, field: 'text' | 'is_correct', value: string | boolean) => {
    const q = { ...questions[qIndex] };
    const opts = [...(q.options || [])];
    if (field === 'is_correct' && questions[qIndex].type === 'single') {
      opts.forEach((o, i) => { opts[i] = { ...o, is_correct: i === oIndex }; });
    } else {
      opts[oIndex] = { ...opts[oIndex], [field]: value };
    }
    q.options = opts;
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  // Matching pair helpers
  const addPair = (qIndex: number) => {
    const q = { ...questions[qIndex] };
    q.matching_pairs = [...(q.matching_pairs || []), { term: '', definition: '' }];
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const removePair = (qIndex: number, pIndex: number) => {
    const q = { ...questions[qIndex] };
    q.matching_pairs = (q.matching_pairs || []).filter((_, i) => i !== pIndex);
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const updatePair = (qIndex: number, pIndex: number, field: 'term' | 'definition', value: string) => {
    const q = { ...questions[qIndex] };
    const pairs = [...(q.matching_pairs || [])];
    pairs[pIndex] = { ...pairs[pIndex], [field]: value };
    q.matching_pairs = pairs;
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  // Keyword helpers
  const addKeyword = (qIndex: number) => {
    const q = { ...questions[qIndex] };
    q.correct_keywords = [...(q.correct_keywords || []), ''];
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const removeKeyword = (qIndex: number, kIndex: number) => {
    const q = { ...questions[qIndex] };
    q.correct_keywords = (q.correct_keywords || []).filter((_, i) => i !== kIndex);
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const updateKeyword = (qIndex: number, kIndex: number, value: string) => {
    const q = { ...questions[qIndex] };
    const kw = [...(q.correct_keywords || [])];
    kw[kIndex] = value;
    q.correct_keywords = kw;
    const all = [...questions];
    all[qIndex] = q;
    setQuestions(all);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasTest && questions.length > 0) {
      await saveTestMutation.mutateAsync({
        questions,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        passing_score: passingScore,
      });
    }
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

  const isPending = updateMutation.isPending || saveTestMutation.isPending;

  const questionTypeLabel: Record<TestQuestion['type'], string> = {
    single: 'Один ответ',
    multiple: 'Несколько ответов',
    matching: 'Соответствие',
    text: 'Текстовый ответ',
  };

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
          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Модуль
            </label>
            <select
              value={selectedModuleId}
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

          {/* Title */}
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Содержание
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Введите содержание темы..."
            />
          </div>

          {/* Order / Scores / Time */}
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

          {/* Toggles */}
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

          {/* Lab tasks */}
          {hasLab && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Задачи лабораторной работы</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addLabTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить задачу
                </Button>
              </div>

              {labTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Нет задач. Нажмите «Добавить задачу» для создания.
                </p>
              ) : (
                <div className="space-y-3">
                  {labTasks.map((task, index) => (
                    <div key={task.id || index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Задача {index + 1}</span>
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Порядок</label>
                            <input
                              type="number"
                              value={task.order}
                              onChange={(e) => updateLabTask(index, 'order', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              min={1}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Баллы</label>
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

          {/* Test questions */}
          {hasTest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Вопросы теста</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вопрос
                </Button>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  Перемешивать вопросы
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  Перемешивать варианты ответов
                </label>
              </div>

              {questions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Нет вопросов. Нажмите «Добавить вопрос» для создания.
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Вопрос {qIndex + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={q.type}
                            onChange={(e) => changeQuestionType(qIndex, e.target.value as TestQuestion['type'])}
                            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            {(Object.entries(questionTypeLabel) as [TestQuestion['type'], string][]).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Question text */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Текст вопроса
                        </label>
                        <textarea
                          value={q.text}
                          onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          placeholder="Введите текст вопроса"
                          required
                        />
                      </div>

                      {/* Single / Multiple options */}
                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Варианты ответов
                            {q.type === 'single' && (
                              <span className="ml-2 text-xs text-gray-400">(выберите один правильный)</span>
                            )}
                            {q.type === 'multiple' && (
                              <span className="ml-2 text-xs text-gray-400">(отметьте все правильные)</span>
                            )}
                          </label>
                          {(q.options || []).map((opt, oIndex) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type={q.type === 'single' ? 'radio' : 'checkbox'}
                                checked={opt.is_correct}
                                onChange={(e) => updateOption(qIndex, oIndex, 'is_correct', e.target.checked)}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder={`Вариант ${oIndex + 1}`}
                                required
                              />
                              {(q.options || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm text-primary hover:underline mt-1"
                          >
                            + Добавить вариант
                          </button>
                        </div>
                      )}

                      {/* Matching */}
                      {q.type === 'matching' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Пары соответствий
                          </label>
                          {(q.matching_pairs || []).map((pair, pIndex) => (
                            <div key={pIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pair.term}
                                onChange={(e) => updatePair(qIndex, pIndex, 'term', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder="Термин"
                                required
                              />
                              <span className="text-gray-400">→</span>
                              <input
                                type="text"
                                value={pair.definition}
                                onChange={(e) => updatePair(qIndex, pIndex, 'definition', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder="Определение"
                                required
                              />
                              {(q.matching_pairs || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePair(qIndex, pIndex)}
                                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addPair(qIndex)}
                            className="text-sm text-primary hover:underline mt-1"
                          >
                            + Добавить пару
                          </button>
                        </div>
                      )}

                      {/* Text */}
                      {q.type === 'text' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ключевые слова для проверки
                            <span className="ml-2 text-xs text-gray-400">(ответ засчитывается, если содержит хотя бы одно)</span>
                          </label>
                          {(q.correct_keywords || []).map((kw, kIndex) => (
                            <div key={kIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={kw}
                                onChange={(e) => updateKeyword(qIndex, kIndex, e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder={`Ключевое слово ${kIndex + 1}`}
                                required
                              />
                              {(q.correct_keywords || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeKeyword(qIndex, kIndex)}
                                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addKeyword(qIndex)}
                            className="text-sm text-primary hover:underline mt-1"
                          >
                            + Добавить ключевое слово
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button variant="secondary" onClick={() => navigate('/teacher/content')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
