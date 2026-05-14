import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import {
  BookOpen, BarChart2, FileText, User, LogOut, Sun, Moon, Menu, X,
  GraduationCap, Settings, Users, ClipboardList, TrendingUp, FlaskConical
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MODULE_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
];

function NavLink({ to, icon: Icon, label, variant = 'default' }: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: 'default' | 'teacher' | 'admin';
}) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  const activeClasses = {
    default: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300',
    teacher: 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-violet-300',
    admin: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  };

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? activeClasses[variant]
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const studentNavItems = [
    { to: '/modules', icon: BookOpen, label: 'Модули' },
    { to: '/progress', icon: TrendingUp, label: 'Прогресс' },
    { to: '/labs', icon: FlaskConical, label: 'Лабораторные' },
  ];

  const teacherNavItems = [
    { to: '/teacher/content', icon: BookOpen, label: 'Контент' },
    { to: '/teacher/labs', icon: ClipboardList, label: 'Проверка работ' },
    { to: '/teacher/stats', icon: BarChart2, label: 'Статистика' },
    { to: '/teacher/students', icon: Users, label: 'Студенты' },
  ];

  const adminNavItems = [
    { to: '/admin/users', icon: User, label: 'Пользователи' },
    { to: '/admin/settings', icon: Settings, label: 'Настройки' },
  ];

  const roleLabel = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' };

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-950', theme === 'dark' && 'dark')}>
      <nav className="glass border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <GraduationCap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <span className="text-base font-bold gradient-text hidden sm:block">
                  EduBook
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-0.5">
                {studentNavItems.map((item) => (
                  <NavLink key={item.to} {...item} variant="default" />
                ))}
                {isTeacher && (
                  <>
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />
                    {teacherNavItems.map((item) => (
                      <NavLink key={item.to} {...item} variant="teacher" />
                    ))}
                  </>
                )}
                {isAdmin && (
                  <>
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />
                    {adminNavItems.map((item) => (
                      <NavLink key={item.to} {...item} variant="admin" />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              >
                {theme === 'dark'
                  ? <Sun className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  : <Moon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                }
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                {user && <UserAvatar name={user.name} />}
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role ? roleLabel[user.role] : ''}</div>
                </div>
                <button
                  onClick={logout}
                  className="ml-1 p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-1 animate-fade-in">
            {studentNavItems.map((item) => (
              <NavLink key={item.to} {...item} variant="default" />
            ))}
            {isTeacher && teacherNavItems.map((item) => (
              <NavLink key={item.to} {...item} variant="teacher" />
            ))}
            {isAdmin && adminNavItems.map((item) => (
              <NavLink key={item.to} {...item} variant="admin" />
            ))}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user && <UserAvatar name={user.name} />}
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role ? roleLabel[user.role as keyof typeof roleLabel] : ''}</div>
                </div>
              </div>
              <button onClick={logout} className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
