import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GraduationCap, Mail, Lock, User, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, name);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
      <div className="auth-grid" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
            Электронный учебник
          </h1>
          <p className="text-blue-200 mt-1.5 flex items-center justify-center gap-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Создайте аккаунт студента
          </p>
        </div>

        <div className="auth-card">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
            Регистрация
          </h2>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
              <Input
                type="text"
                placeholder="Полное имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
              <Input
                type="password"
                placeholder="Пароль (мин. 8 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2 btn-gradient">
              Создать аккаунт
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 text-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Уже есть аккаунт? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
