import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { TeacherLabSubmission } from '@/types';
import { FileText, CheckCircle2, Clock, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate } from '@/lib/utils';
import { useState } from 'react';

interface LabSubmissionList {
  submissions: TeacherLabSubmission[];
  total: number;
  page: number;
  page_size: number;
}

export default function TeacherLabsPage() {
  const [status, setStatus] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherLabSubmission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<LabSubmissionList>({
    queryKey: ['teacher', 'labs', status],
    queryFn: async () => {
      const response = await api.get('/teacher/labs', { params: { status } });
      return response.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: string; grade: number; feedback: string }) => {
      const response = await api.put(`/labs/${id}/grade`, { grade, feedback });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'labs'] });
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback('');
    },
  });

  const handleGrade = () => {
    if (selectedSubmission) {
      gradeMutation.mutate({ id: selectedSubmission.id, grade, feedback });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <FileText className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Проверка работ</h1>
          <p className="text-gray-500 dark:text-gray-400">Лабораторные работы студентов</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'needs_revision', 'all'].map((s) => (
          <Button
            key={s}
            variant={status === s ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s === 'pending' && 'На проверке'}
            {s === 'approved' && 'Проверено'}
            {s === 'needs_revision' && 'На доработку'}
            {s === 'all' && 'Все'}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="card p-6 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : data?.submissions && data.submissions.length > 0 ? (
            data.submissions.map((submission) => (
              <div
                key={submission.id}
                className={cn(
                  'card p-4 cursor-pointer transition-colors',
                  selectedSubmission?.id === submission.id && 'ring-2 ring-primary'
                )}
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      submission.status === 'approved' && 'bg-green-100 dark:bg-green-900/30',
                      submission.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30',
                      submission.status === 'needs_revision' && 'bg-red-100 dark:bg-red-900/30'
                    )}>
                      {submission.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {submission.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                      {submission.status === 'needs_revision' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{submission.student_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{submission.topic_title}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{submission.file_name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{formatDate(submission.submitted_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Нет работ для проверки</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          {selectedSubmission ? (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Оценить работу</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Студент</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedSubmission.student_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSubmission.student_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Файл</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedSubmission.file_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Оценка (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                    placeholder="Введите оценку"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Комментарий</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Введите комментарий для студента..."
                    className="input min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGrade} isLoading={gradeMutation.isPending}>
                    Сохранить оценку
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedSubmission(null)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Выберите работу для проверки</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}