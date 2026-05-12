import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Plus, Search, Download, Lock, Unlock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  group_id: string | null;
  is_active: boolean;
  average_score: number | null;
  completed_topics: number;
}

interface StudentList {
  students: Student[];
  total: number;
  page: number;
  page_size: number;
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<StudentList>({
    queryKey: ['teacher', 'students', search],
    queryFn: async () => {
      const response = await api.get('/teacher/students', { params: { search: search || undefined } });
      return response.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const response = await api.post('/teacher/students', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] });
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
    },
  });

  const handleAddStudent = () => {
    addMutation.mutate({ email: newEmail, name: newName, password: newPassword });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Студенты</h1>
            <p className="text-gray-500 dark:text-gray-400">Управление студентами</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.open('/api/teacher/export/report', '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить студента
          </Button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : data?.students && data.students.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Студент</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Темы</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Средний балл</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Статус</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-4 px-6">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{student.name}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{student.email}</td>
                  <td className="py-4 px-6 text-center">{student.completed_topics}</td>
                  <td className="py-4 px-6 text-center">
                    {student.average_score !== null ? (
                      <span className={student.average_score >= 70 ? 'text-green-600' : 'text-red-600'}>
                        {student.average_score}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {student.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Студенты не найдены</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Добавить студента</h3>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="student@example.com"
              />
              <Input
                label="ФИО"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
              <Input
                label="Пароль"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddStudent} isLoading={addMutation.isPending}>
                  Добавить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}