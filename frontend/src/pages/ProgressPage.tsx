import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { ProgressCard } from '@/components/ProgressCard';
import type { Progress, TopicStats } from '@/types';
import { BarChart2, TrendingUp, Award, Clock, Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function ProgressPage() {
  const navigate = useNavigate();

  const { data: progress } = useQuery<Progress>({
    queryKey: ['progress'],
    queryFn: async () => {
      const response = await api.get('/progress');
      return response.data;
    },
  });

  const { data: stats } = useQuery<TopicStats[]>({
    queryKey: ['progress', 'stats'],
    queryFn: async () => {
      const response = await api.get('/progress/stats');
      return response.data;
    },
  });

  // Prepare chart data
  const scoresChartData = {
    labels: stats?.map(s => s.topic_title.slice(0, 20)) || [],
    datasets: [
      {
        label: 'Балл за тест',
        data: stats?.map(s => s.best_score || 0) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const attemptsChartData = {
    labels: stats?.map(s => s.topic_title.slice(0, 20)) || [],
    datasets: [
      {
        label: 'Количество попыток',
        data: stats?.map(s => s.attempts) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  const progressDistributionData = {
    labels: ['Завершено', 'В процессе', 'Не начато'],
    datasets: [
      {
        data: [
          progress?.completed_topics || 0,
          progress?.in_progress_topics || 0,
          (progress?.total_topics || 0) - (progress?.completed_topics || 0) - (progress?.in_progress_topics || 0),
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
      },
    ],
  };

  const handleDownloadCertificate = async () => {
    try {
      const response = await api.get('/progress/certificate', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Не удалось скачать сертификат. Убедитесь, что вы прошли все темы.');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <BarChart2 className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Моя статистика</h1>
          <p className="text-gray-500 dark:text-gray-400">Отслеживайте свой прогресс</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {progress && <ProgressCard progress={progress} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Распределение прогресса</h3>
              <div className="h-64">
                <Doughnut
                  data={progressDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Баллы за тесты</h3>
              <div className="h-64">
                <Line
                  data={scoresChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Количество попыток по темам</h3>
            <div className="h-64">
              <Bar
                data={attemptsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Детальная статистика по темам
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Тема
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Модуль
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Попыток
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Лучший балл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.map((stat) => (
                    <tr
                      key={stat.topic_id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => navigate(`/topic/${stat.topic_id}`)}
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stat.topic_title}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{stat.module_title}</td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{stat.attempts}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${stat.best_score && stat.best_score >= 70 ? 'text-green-600' : 'text-gray-600'}`}>
                          {stat.best_score ?? '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!stats || stats.length === 0) && (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                Нет данных о прохождении тестов
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {progress && progress.percentage === 100 && (
            <div className="card p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Поздравляем!</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Вы завершили все темы курса. Вы можете скачать сертификат.
              </p>
              <button
                onClick={handleDownloadCertificate}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать сертификат
              </button>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Достижения</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Первая тема</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Завершите первую тему</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TrendingUp className="w-8 h-8 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">В процессе</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">10 тем в работе</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Последняя активность</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div className="text-sm">
                  <div className="text-gray-900 dark:text-gray-100">Сегодня</div>
                  <div className="text-gray-500 dark:text-gray-400">2 часа изучения</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
