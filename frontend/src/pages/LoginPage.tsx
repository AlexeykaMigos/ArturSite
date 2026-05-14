import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GraduationCap, Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      queryClient.clear();
      navigate('/modules');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      {/* Grid overlay */}
      <div className="auth-grid" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo card */}
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
            Информационные системы и технологии
          </p>
        </div>

        <div className="auth-card">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
            Войти в систему
          </h2>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: 18, height: 18 }} />
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
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2 btn-gradient">
              Войти
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 text-center text-sm space-y-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Нет аккаунта? </span>
              <Link to="/register" className="text-primary font-medium hover:underline">
                Зарегистрироваться
              </Link>
            </div>
            <div>
              <Link to="/forgot-password" className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors text-xs">
                Забыли пароль?
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-blue-200/60 text-xs mt-6">
          Демо: student@demo.com / admin123
        </p>
      </div>
    </div>
  );
}
