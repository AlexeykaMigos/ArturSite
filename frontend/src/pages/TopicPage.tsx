import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, FileText, CheckCircle2, Clock, HelpCircle,
  Upload, X, FlaskConical, ChevronRight, Star, BookOpen
} from 'lucide-react';
import type { TopicWithProgress, Lab } from '@/types';
import { useState, useRef } from 'react';
import { CommentsSection } from '@/components/CommentsSection';

function TopicSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="card p-8">
        <div className="h-8 skeleton rounded-xl w-2/3 mb-4" />
        <div className="h-4 skeleton rounded w-full mb-2" />
        <div className="h-4 skeleton rounded w-4/5 mb-2" />
        <div className="h-4 skeleton rounded w-3/5" />
      </div>
    </div>
  );
}

function LabUploadModal({ lab, topicId, onClose }: { lab: Lab; topicId: string; onClose: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/topics/${topicId}/lab/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab', topicId] });
      queryClient.invalidateQueries({ queryKey: ['labs', 'my'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Не удалось загрузить файл';
      setUploadError(message);
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setUploadError(null); }
  };

  const extensions = lab.allowed_extensions.join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Загрузка работы
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            dragOver
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
              : 'border-gray-200 dark:border-gray-600 hover:border-primary hover:bg-primary/5'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSelectedFile(file);
              setUploadError(null);
            }}
          />
          {selectedFile ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Перетащите файл или нажмите для выбора
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Форматы: {extensions} · Максимум 100 МБ
              </p>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn btn-secondary flex-1">Отмена</button>
          <Button
            onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
            isLoading={uploadMutation.isPending}
            disabled={!selectedFile}
            className="flex-1"
          >
            Загрузить
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  if (isLoading) return <TopicSkeleton />;

  if (!topic) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Тема не найдена</h2>
      </div>
    );
  }

  const statusConfig = {
    completed: { label: 'Завершена', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    in_progress: { label: 'В процессе', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    not_started: { label: 'Не начата', icon: BookOpen, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' },
  };
  const { label: statusLabel, icon: StatusIcon, color: statusColor, bg: statusBg } =
    statusConfig[topic.progress_status as keyof typeof statusConfig] ?? statusConfig.not_started;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
        <button onClick={() => navigate('/modules')} className="hover:text-primary transition-colors">
          Модули
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{topic.title}</span>
      </div>

      {/* Main card */}
      <div className="card p-8 mb-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {topic.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('badge', statusBg, statusColor)}>
                <StatusIcon className="w-3 h-3" />
                {statusLabel}
              </span>
              {topic.has_test && (
                <span className="badge badge-blue">
                  <HelpCircle className="w-3 h-3" /> Тест
                </span>
              )}
              {topic.has_lab && (
                <span className="badge badge-purple">
                  <FlaskConical className="w-3 h-3" /> Лаба
                </span>
              )}
              {topic.time_limit && (
                <span className="badge badge-gray">
                  <Clock className="w-3 h-3" /> {topic.time_limit} мин
                </span>
              )}
            </div>
          </div>

          {topic.best_score !== null && topic.best_score !== undefined && (
            <div className="flex-shrink-0 text-center bg-primary/5 dark:bg-primary/10 rounded-2xl px-4 py-3 border border-primary/10">
              <div className="text-2xl font-bold text-primary">{topic.best_score}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Лучший результат
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="topic-content"
          dangerouslySetInnerHTML={{ __html: topic.content }}
        />

        {/* Test section */}
        {topic.has_test && (
          <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Проверьте знания</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Пройдите тест для завершения темы. Минимальный балл: {topic.passing_score}%
                  {topic.time_limit && ` · Время: ${topic.time_limit} мин`}
                </p>
                <Button onClick={() => navigate(`/topic/${topicId}/test`)}>
                  Пройти тест
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lab section */}
      {lab && (
        <div className="card p-6 mb-5 border-l-4 border-l-secondary">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{lab.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{lab.description}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-secondary">{lab.max_score}</div>
              <div className="text-xs text-gray-400">баллов</div>
            </div>
          </div>

          {lab.requirements && lab.requirements.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Требования:</h4>
              <ul className="space-y-1.5">
                {lab.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lab.tasks && lab.tasks.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Задачи ({lab.tasks.length}):
              </h4>
              <div className="space-y-2.5">
                {lab.tasks.sort((a, b) => a.order - b.order).map((task, i) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{task.description}</p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 badge badge-purple">{task.max_score} б.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowLabUpload(true)}
            className="btn btn-secondary gap-2"
          >
            <Upload className="w-4 h-4" />
            Загрузить работу
          </button>
        </div>
      )}

      {/* Comments */}
      <CommentsSection topicId={topicId || ''} />

      {/* Navigation */}
      <div className="flex justify-between items-center mt-5">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Назад
        </Button>
        {topic.has_test && (
          <Button onClick={() => navigate(`/topic/${topicId}/test`)}>
            К тесту
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Upload modal */}
      {showLabUpload && lab && (
        <LabUploadModal
          lab={lab}
          topicId={topicId || ''}
          onClose={() => setShowLabUpload(false)}
        />
      )}
    </div>
  );
}

