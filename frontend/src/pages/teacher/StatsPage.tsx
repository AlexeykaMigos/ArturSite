import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { BarChart2, Download, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatsOverview {
  total_students: number;
  average_progress: number;
  struggling_students: { student_id: string; name: string; progress: number }[];
  lab_stats: Record<string, number>;
  total_topics: number;
}

export default function TeacherStatsPage() {
  const { data: stats, isLoading } = useQuery<StatsOverview>({
    queryKey: ['teacher', 'stats'],
    queryFn: async () => {
      const response = await api.get('/teacher/stats/overview');
      return response.data;
    },
  });

  // Prepare chart data
  const labDistributionData = {
    labels: Object.keys(stats?.lab_stats || {}).map(k => k === 'pending' ? 'Ожидают' : k === 'approved' ? 'Приняты' : k),
    datasets: [
      {
        data: Object.values(stats?.lab_stats || {}),
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  const strugglingStudentsData = {
    labels: stats?.struggling_students?.slice(0, 10).map(s => s.name.slice(0, 15)) || [],
    datasets: [
      {
        label: 'Прогресс %',
        data: stats?.struggling_students?.slice(0, 10).map(s => s.progress) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <BarChart2 className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Статистика</h1>
            <p className="text-gray-500 dark:text-gray-400">Обзор успеваемости группы</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.open('/api/teacher/export/report', '_blank')}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт отчёта
        </Button>
      </div>

      {isLoading ? (
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-4 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Всего студентов</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.total_students || 0}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Средний прогресс</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.average_progress || 0}%
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Тем всего</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.total_topics || 0}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Лабораторные</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.lab_stats?.approved || 0} / {stats?.lab_stats?.pending || 0}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Студенты с низким прогрессом</h3>
              <div className="h-64">
                <Bar
                  data={strugglingStudentsData}
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

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Распределение лабораторных работ</h3>
              <div className="h-64">
                <Doughnut
                  data={labDistributionData}
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
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Список отстающих студентов</h3>
            {stats?.struggling_students && stats.struggling_students.length > 0 ? (
              <div className="space-y-2">
                {stats.struggling_students.map((student) => (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{student.name}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{student.progress}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Нет студентов с низким прогрессом</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Распределение лабораторных работ</h3>
            <div className="space-y-4">
              {stats?.lab_stats && Object.entries(stats.lab_stats).map(([status, count]) => (
                <div key={status} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-600 dark:text-gray-300 capitalize">{status}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(count / stats.total_students) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}