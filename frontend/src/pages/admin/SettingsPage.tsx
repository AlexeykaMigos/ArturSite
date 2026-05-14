import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/api/client';
import { Settings as SettingsIcon, Database, Shield, Download, Trash2, Users, BookOpen, Activity } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    app_name: 'Электронный учебник',
    app_version: '1.0.0',
    contact_email: 'admin@example.com',
    session_timeout: 3600,
    allow_registration: true,
    require_email_confirmation: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  const { data: currentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/settings');
      return response.data;
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const response = await api.put('/admin/settings', newSettings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      alert('Настройки сохранены');
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/backup');
      return response.data;
    },
    onSuccess: (data) => {
      alert(`Резервная копия создана: ${data.filename}`);
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/cache/clear');
      return response.data;
    },
    onSuccess: () => {
      alert('Кэш очищен');
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleCreateBackup = () => {
    if (confirm('Создать резервную копию базы данных?')) {
      createBackupMutation.mutate();
    }
  };

  const handleClearCache = () => {
    if (confirm('Очистить кэш системы?')) {
      clearCacheMutation.mutate();
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 ${color} rounded-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Настройки</h1>
          <p className="text-gray-500 dark:text-gray-400">Управление системой</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* System Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Статистика системы</h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Всего пользователей" value={stats?.total_users || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" />
              <StatCard icon={Users} label="Студентов" value={stats?.total_students || 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300" />
              <StatCard icon={Users} label="Преподавателей" value={stats?.total_teachers || 0} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300" />
              <StatCard icon={BookOpen} label="Модулей" value={stats?.total_modules || 0} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300" />
              <StatCard icon={BookOpen} label="Тем" value={stats?.total_topics || 0} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300" />
              <StatCard icon={Activity} label="Uptime" value={stats?.uptime || '-'} color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300" />
            </div>
          )}
        </div>

        {/* Application Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Настройки приложения</h2>
          {settingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название приложения
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email для связи
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тайм-аут сессии (секунды)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allow_registration}
                    onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Разрешить регистрацию</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.require_email_confirmation}
                    onChange={(e) => setSettings({ ...settings, require_email_confirmation: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Требовать подтверждение email</span>
                </label>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateSettingsMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          )}
        </div>

        {/* System Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Действия системы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">Создать резервную копию</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Экспорт базы данных</div>
              </div>
            </button>

            <button
              onClick={handleClearCache}
              disabled={clearCacheMutation.isPending}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">Очистить кэш</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Удалить кэшированные данные</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
