import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cn, formatTime } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Test, TestResult } from '@/types';

export default function TestPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const { data: test, isLoading } = useQuery<any>({
    queryKey: ['test', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/test`);
      return response.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/topics/${topicId}/test/submit`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  useEffect(() => {
    if (test?.time_limit) {
      setTimeLeft(test.time_limit * 60);
    }
  }, [test]);

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

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const timeSpent = test?.time_limit ? test.time_limit * 60 - (timeLeft || 0) : 0;
    submitMutation.mutate({
      answers: Object.entries(answers).map(([qId, ans]) => ({ question_id: qId, ...ans })),
      time_spent: timeSpent,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          ))}
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8">
          <div className="text-center mb-8">
            {result.passed ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Ваш результат: {result.percentage}% (нужно {result.passed_score}%)
            </p>
          </div>

          <div className="space-y-6">
            {result.details.map((detail, idx) => (
              <div
                key={detail.question_id}
                className={cn(
                  'p-4 rounded-lg border',
                  detail.correct
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {detail.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Вопрос {idx + 1}
                  </span>
                </div>
                {!detail.correct && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Правильный ответ: {JSON.stringify(detail.correct_answer)}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ваш ответ: {JSON.stringify(detail.user_answer)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button variant="secondary" onClick={() => navigate('/modules')}>
              К модулям
            </Button>
            <Button onClick={() => {
              setResult(null);
              setAnswers({});
            }}>
              Пройти заново
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Тест не найден
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                timeLeft < 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700'
              )}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Вопросов: {test.questions.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Проходной балл: {test.passing_score}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            Отвечено: {Object.keys(answers).length}/{test.questions.length}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {test.questions.map((question: any, idx: number) => (
          <div key={question.id} className={cn(
            'card p-6',
            flagged.has(question.id) && 'border-l-4 border-l-yellow-500'
          )}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {idx + 1}.
                </span>
                <span className="text-gray-900 dark:text-gray-100">{question.text}</span>
              </div>
              <button
                onClick={() => toggleFlag(question.id)}
                className={cn(
                  'p-1 rounded',
                  flagged.has(question.id)
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>

            {question.type === 'single' && question.options && (
              <div className="space-y-2">
                {question.options.map((option: any) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      answers[question.id]?.selected_option_id === option.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id]?.selected_option_id === option.id}
                      onChange={() => handleSingleChoice(question.id, option.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900 dark:text-gray-100">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'multiple' && question.options && (
              <div className="space-y-2">
                {question.options.map((option: any) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      answers[question.id]?.selected_option_ids?.includes(option.id)
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={answers[question.id]?.selected_option_ids?.includes(option.id) || false}
                      onChange={(e) => handleMultipleChoice(question.id, option.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900 dark:text-gray-100">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                value={answers[question.id]?.answer_text || ''}
                onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                placeholder="Введите ваш ответ..."
                className="input min-h-[100px]"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          isLoading={submitMutation.isPending}
          size="lg"
        >
          Отправить ответы
        </Button>
      </div>
    </div>
  );
}