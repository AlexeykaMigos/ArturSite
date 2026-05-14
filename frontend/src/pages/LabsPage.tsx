import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import type { LabSubmission } from '@/types';
import { FlaskConical, CheckCircle2, Clock, AlertTriangle, ArrowRight, Upload } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const STATUS_CONFIG = {
  approved: {
    label: 'Принята',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeClass: 'badge-green',
  },
  pending: {
    label: 'На проверке',
    icon: Clock,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeClass: 'badge-yellow',
  },
  needs_revision: {
    label: 'На доработке',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    badgeClass: 'badge badge-gray',
  },
};

function LabSubmissionCard({ submission }: { submission: LabSubmission }) {
  const status = STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="card p-5 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', status.bg)}>
          <StatusIcon className={cn('w-5 h-5', status.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {submission.file_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {submission.topic_title}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              {submission.grade !== null && submission.grade !== undefined ? (
                <div>
                  <div className="text-xl font-bold text-primary">{submission.grade}</div>
                  <div className="text-xs text-gray-400">баллов</div>
                </div>
              ) : (
                <span className={cn('badge', status.badgeClass)}>
                  {status.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Загружено: {formatDate(submission.submitted_at)}
            </span>
            {submission.graded_at && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Проверено: {formatDate(submission.graded_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {submission.feedback && (
        <div className="mt-4 p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Комментарий преподавателя
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onGoToModules }: { onGoToModules: () => void }) {
  return (
    <div className="card p-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center mx-auto mb-5">
        <FlaskConical className="w-10 h-10 text-purple-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Пока нет загруженных работ
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Изучайте темы и сдавайте лабораторные работы прямо со страницы темы
      </p>
      <button
        onClick={onGoToModules}
        className="btn btn-primary gap-2 mx-auto"
      >
        Перейти к курсам
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function LabsPage() {
  const navigate = useNavigate();

  const { data: submissions, isLoading } = useQuery<LabSubmission[]>({
    queryKey: ['labs', 'my'],
    queryFn: async () => {
      const response = await api.get('/labs/my');
      return response.data;
    },
  });

  const approved = submissions?.filter(s => s.status === 'approved').length ?? 0;
  const pending = submissions?.filter(s => s.status === 'pending').length ?? 0;
  const needsRevision = submissions?.filter(s => s.status === 'needs_revision').length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <FlaskConical className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Мои лабораторные</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Загруженные работы и статус проверки</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/modules')}
          className="btn btn-primary gap-2 hidden sm:flex"
        >
          <Upload className="w-4 h-4" />
          Загрузить работу
        </button>
      </div>

      {/* Stats row (only when there are submissions) */}
      {submissions && submissions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Принято', value: approved, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'На проверке', value: pending, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'На доработке', value: needsRevision, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('card p-4 text-center', bg)}>
              <div className={cn('text-2xl font-bold', color)}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="flex gap-4">
                <div className="w-11 h-11 skeleton rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : submissions && submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <LabSubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      ) : (
        <EmptyState onGoToModules={() => navigate('/modules')} />
      )}
    </div>
  );
}
