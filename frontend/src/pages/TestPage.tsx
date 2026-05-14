import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cn, formatTime } from '@/lib/utils';
import {
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  Flag, Send, BookOpen, Trophy
} from 'lucide-react';
import type { TestResult, TopicWithProgress } from '@/types';

export default function TestPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: test, isLoading } = useQuery<any>({
    queryKey: ['test', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/test`);
      return response.data;
    },
  });

  const { data: topicProgress, isLoading: isProgressLoading } = useQuery<TopicWithProgress>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/with-progress`);
      return response.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/topics/${topicId}/test/submit`, data);
      return response.data;
    },
    onSuccess: (data) => setResult(data),
  });

  useEffect(() => {
    if (test?.time_limit) setTimeLeft(test.time_limit * 60);
  }, [test]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [timeLeft, result]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          submitMutation.mutate({
            answers: Object.entries(answers).map(([qId, ans]) => ({ question_id: qId, ...ans })),
            time_spent: test.time_limit * 60 - (prev - 1),
          });
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result, answers, test]);

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId } }));
  };

  const handleMultipleChoice = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selected_option_ids || [];
      return {
        ...prev,
        [questionId]: {
          selected_option_ids: checked
            ? [...current, optionId]
            : current.filter((id: string) => id !== optionId),
        },
      };
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answer_text: text } }));
  };

  const handleMatchingAnswer = (questionId: string, termId: string, definitionId: string) => {
    setAnswers((prev) => {
      const currentPairs = prev[questionId]?.pairs || [];
      const updatedPairs = currentPairs.filter((pair: any) => pair.term_id !== termId);
      if (definitionId) updatedPairs.push({ term_id: termId, definition_id: definitionId });
      return { ...prev, [questionId]: { pairs: updatedPairs } };
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const handleSubmit = () => {
    const timeSpent = test?.time_limit ? test.time_limit * 60 - (timeLeft || 0) : 0;
    submitMutation.mutate({
      answers: Object.entries(answers).map(([qId, ans]) => ({ question_id: qId, ...ans })),
      time_spent: timeSpent,
    });
  };

  const isAnswered = (q: any) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'single') return !!a.selected_option_id;
    if (q.type === 'multiple') return (a.selected_option_ids || []).length > 0;
    if (q.type === 'text') return (a.answer_text || '').trim().length > 0;
    if (q.type === 'matching') return (a.pairs || []).length > 0;
    return false;
  };

  if (isLoading || isProgressLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="card p-6">
          <div className="h-4 skeleton rounded w-1/3 mb-3" />
          <div className="h-2 skeleton rounded mb-1" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-5 skeleton rounded w-2/3 mb-4" />
            <div className="h-12 skeleton rounded mb-2" />
            <div className="h-12 skeleton rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (topicProgress?.progress_status === 'completed' && !result) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-5">
            <Trophy className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Тема уже пройдена!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Вы уже успешно прошли этот тест.
          </p>
          {topicProgress.best_score !== null && topicProgress.best_score !== undefined && (
            <p className="text-lg font-semibold text-primary mb-6">
              Лучший результат: {topicProgress.best_score}%
            </p>
          )}
          <Button onClick={() => navigate(`/topic/${topicId}`)}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Вернуться к теме
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    const scoreColor = result.passed
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="card p-8 mb-5">
          <div className="text-center mb-8">
            <div className={cn(
              'inline-flex items-center justify-center w-24 h-24 rounded-full mb-5',
              result.passed
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            )}>
              {result.passed
                ? <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                : <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              }
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {result.passed
                ? 'Отличная работа! Вы успешно завершили тему.'
                : `Нужно набрать минимум ${result.passed_score}%. Попробуйте ещё раз!`}
            </p>

            {/* Score display */}
            <div className="inline-flex items-center gap-6 bg-gray-50 dark:bg-gray-800 rounded-2xl px-8 py-4">
              <div className="text-center">
                <div className={cn('text-4xl font-extrabold', scoreColor)}>{result.percentage}%</div>
                <div className="text-xs text-gray-400 mt-0.5">Ваш результат</div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-300 dark:text-gray-600">{result.passed_score}%</div>
                <div className="text-xs text-gray-400 mt-0.5">Проходной балл</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Разбор ответов</h3>
          <div className="space-y-3">
            {result.details.map((detail, idx) => {
              const question = test?.questions?.find((q: any) => q.id === detail.question_id);
              const formatAnswer = (answer: any, type: string) => {
                if (type === 'matching' && Array.isArray(answer)) {
                  return answer.map((pair: any) => {
                    const term = question?.matching_terms?.find((t: any) => t.id === pair.term_id);
                    const def = question?.matching_definitions?.find((d: any) => d.id === pair.definition_id);
                    return `${term?.text || pair.term_id} → ${def?.text || pair.definition_id}`;
                  }).join(', ');
                }
                if (type === 'single' || type === 'multiple') {
                  if (Array.isArray(answer)) {
                    return answer.map((id: string) => {
                      const opt = question?.options?.find((o: any) => o.id === id);
                      return opt?.text || id;
                    }).join(', ');
                  }
                  const opt = question?.options?.find((o: any) => o.id === answer);
                  return opt?.text || answer;
                }
                if (type === 'text') return Array.isArray(answer) ? answer.join(', ') : answer;
                return JSON.stringify(answer);
              };

              return (
                <div
                  key={detail.question_id}
                  className={cn(
                    'p-4 rounded-xl border',
                    detail.correct
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {detail.correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    }
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      Вопрос {idx + 1}: {question?.text?.slice(0, 60)}{question?.text?.length > 60 ? '…' : ''}
                    </span>
                  </div>
                  {!detail.correct && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Правильно: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatAnswer(detail.correct_answer, question?.type)}</span>
                      {' · '}
                      Ваш ответ: <span className="text-red-500">{formatAnswer(detail.user_answer, question?.type) || '(нет ответа)'}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <Button variant="secondary" onClick={() => navigate('/modules')}>
              К модулям
            </Button>
            <Button onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); }}>
              Пройти заново
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-16 card p-12">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Тест не найден</h2>
      </div>
    );
  }

  const questions = test.questions || [];
  const totalQ = questions.length;
  const answeredCount = questions.filter(isAnswered).length;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  const currentQuestion = questions[currentIndex];
  const isTimeLow = timeLeft !== null && timeLeft < 60;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header bar */}
      <div className="card p-4 mb-5 sticky top-20 z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {timeLeft !== null && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono font-bold transition-colors',
                isTimeLow
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              )}>
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {answeredCount}/{totalQ} ответов
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              · Проходной: {test.passing_score}%
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={submitMutation.isPending}
            size="sm"
            className="gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Завершить
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question dots */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {questions.map((q: any, i: number) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                i === currentIndex
                  ? 'bg-primary text-white scale-110'
                  : isAnswered(q)
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : flagged.has(q.id)
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current question */}
      {currentQuestion && (
        <div className={cn(
          'card p-6 mb-4 animate-slide-up',
          flagged.has(currentQuestion.id) && 'border-l-4 border-l-amber-400'
        )}>
          <div className="flex items-start justify-between mb-5 gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {currentIndex + 1}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {currentQuestion.type === 'single' && 'Один ответ'}
                  {currentQuestion.type === 'multiple' && 'Несколько ответов'}
                  {currentQuestion.type === 'text' && 'Текстовый ответ'}
                  {currentQuestion.type === 'matching' && 'Соответствие'}
                </span>
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                {currentQuestion.text}
              </p>
            </div>
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={cn(
                'p-2 rounded-lg flex-shrink-0 transition-colors',
                flagged.has(currentQuestion.id)
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-600'
              )}
              title="Отметить вопрос"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Answer area */}
          {currentQuestion.type === 'single' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option: any, optIdx: number) => {
                const selected = answers[currentQuestion.id]?.selected_option_id === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-150 border',
                      selected
                        ? 'bg-primary/8 border-primary/30 dark:bg-primary/15 dark:border-primary/40'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      selected ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      checked={selected}
                      onChange={() => handleSingleChoice(currentQuestion.id, option.id)}
                      className="sr-only"
                    />
                    <span className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed flex-1">
                      <span className="text-gray-400 dark:text-gray-500 mr-1.5 font-mono text-xs">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'multiple' && currentQuestion.options && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">Можно выбрать несколько вариантов</p>
              {currentQuestion.options.map((option: any, optIdx: number) => {
                const checked = answers[currentQuestion.id]?.selected_option_ids?.includes(option.id) || false;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-150 border',
                      checked
                        ? 'bg-primary/8 border-primary/30 dark:bg-primary/15 dark:border-primary/40'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      checked ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleMultipleChoice(currentQuestion.id, option.id, e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed flex-1">
                      <span className="text-gray-400 dark:text-gray-500 mr-1.5 font-mono text-xs">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Введите ключевое слово или фразу</p>
              <textarea
                value={answers[currentQuestion.id]?.answer_text || ''}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                placeholder="Ваш ответ..."
                className="input min-h-[120px] resize-y"
              />
            </div>
          )}

          {currentQuestion.type === 'matching' && currentQuestion.matching_terms && currentQuestion.matching_definitions && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-3">Сопоставьте термины с определениями</p>
              {currentQuestion.matching_terms.map((term: any) => {
                const selectedDef = answers[currentQuestion.id]?.pairs?.find(
                  (pair: any) => pair.term_id === term.id
                )?.definition_id || '';
                return (
                  <div key={term.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {term.text}
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                    <select
                      value={selectedDef}
                      onChange={(e) => handleMatchingAnswer(currentQuestion.id, term.id, e.target.value)}
                      className="input max-w-[220px] text-sm"
                    >
                      <option value="">Выберите...</option>
                      {currentQuestion.matching_definitions.map((def: any) => (
                        <option key={def.id} value={def.id}>{def.text}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>

        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {totalQ}
        </span>

        {currentIndex < totalQ - 1 ? (
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(Math.min(totalQ - 1, currentIndex + 1))}
            className="gap-1"
          >
            Далее
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            isLoading={submitMutation.isPending}
            className="gap-1.5"
          >
            <Send className="w-4 h-4" />
            Завершить тест
          </Button>
        )}
      </div>
    </div>
  );
}
