import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import type { LabSubmission } from '@/types';
import { FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function LabsPage() {
  const { data: submissions, isLoading } = useQuery<LabSubmission[]>({
    queryKey: ['labs', 'my'],
    queryFn: async () => {
      const response = await api.get('/labs/my');
      return response.data;
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Мои лабораторные работы</h1>
          <p className="text-gray-500 dark:text-gray-400">Загруженные работы и их статус</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : submissions && submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-3 rounded-lg',
                    submission.status === 'approved' && 'bg-green-100 dark:bg-green-900/30',
                    submission.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30',
                    submission.status === 'needs_revision' && 'bg-red-100 dark:bg-red-900/30'
                  )}>
                    {submission.status === 'approved' && <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />}
                    {submission.status === 'pending' && <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
                    {submission.status === 'needs_revision' && <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{submission.file_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Тема: {submission.topic_title}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Загружено: {formatDate(submission.submitted_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {submission.grade !== null && submission.grade !== undefined ? (
                    <div className="text-2xl font-bold text-primary">{submission.grade}</div>
                  ) : (
                    <span className="text-gray-400">На проверке</span>
                  )}
                </div>
              </div>
              {submission.feedback && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Комментарий преподавателя:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{submission.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Нет загруженных работ</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Лабораторные работы появятся после их выполнения
          </p>
        </div>
      )}
    </div>
  );
}
