# SPEC.md — Электронный учебник «Информационные системы и технологии»

## 1. Концепция и видение

Интерактивный электронный учебник для изучения дисциплины «Информационные системы и технологии». Представляет собой современное веб-приложение с богатым функционалом для онлайн-обучения, тестирования и отслеживания прогресса студентов. Целевая аудитория — студенты вузов, изучающие информационные системы, а также преподаватели, управляющие контентом и проверяющие работы.

**Ключевые принципы:**
- Интуитивный интерфейс без лишних барьеров между студентом и материалом
- Быстрая обратная связь при прохождении тестов
- Прозрачный прогресс для мотивации студентов
- Эффективные инструменты для преподавателей

---

## 2. Дизайн-система

### Цветовая палитра

| Роль | Светлая тема | Темная тема | Применение |
|------|-------------|-------------|------------|
| Primary | `#2563eb` | `#3b82f6` | Кнопки, ссылки, активные элементы |
| Secondary | `#7c3aed` | `#8b5cf6` | Акценты, иконки достижений |
| Success | `#10b981` | `#34d399` | Завершённые темы, правильные ответы |
| Warning | `#f59e0b` | `#fbbf24` | Темы в процессе, предупреждения |
| Error | `#ef4444` | `#f87171` | Ошибки, неправильные ответы |
| Background | `#f8fafc` | `#0f172a` | Основной фон |
| Surface | `#ffffff` | `#1e293b` | Карточки, панели |
| Text Primary | `#1e293b` | `#f1f5f9` | Основной текст |
| Text Secondary | `#64748b` | `#94a3b8` | Второстепенный текст |
| Border | `#e2e8f0` | `#334155` | Границы элементов |

### Типографика

- **Заголовки:** Inter, 600-700 weight
- **Основной текст:** Inter, 400 weight
- **Код:** JetBrains Mono, 400 weight
- **Fallback:** system-ui, -apple-system, sans-serif

| Элемент | Размер (desktop) | Размер (mobile) |
|---------|-----------------|-----------------|
| H1 | 2.5rem (40px) | 1.875rem (30px) |
| H2 | 2rem (32px) | 1.5rem (24px) |
| H3 | 1.5rem (24px) | 1.25rem (20px) |
| Body | 1rem (16px) | 1rem (16px) |
| Small | 0.875rem (14px) | 0.875rem (14px) |

### Пространственная система

- Базовый unit: 4px
- Отступы: 4, 8, 12, 16, 24, 32, 48, 64px
- Border radius: 4px (small), 8px (medium), 12px (large), 9999px (pill)
- Max content width: 1280px

### Анимации

- **Переходы:** 150ms ease для hover, 300ms ease для появления
- **Модальные окна:** scale 0.95 → 1, opacity 0 → 1, 200ms ease-out
- **Уведомления:** slide-in справа, 300ms
- **Прогресс-бары:** плавное заполнение, 500ms ease-out

---

## 3. Структура и навигация

### Архитектура маршрутов

```
/                           → Главная страница учебника (авторизованные)
/login                      → Страница входа
/register                   → Страница регистрации
/forgot-password            → Восстановление пароля

/student/
  /                          → Дашборд студента
  /modules                   → Список модулей
  /module/:id                → Модуль с темами
  /topic/:id                 → Страница темы
  /topic/:id/test            → Тест по теме
  /topic/:id/lab             → Лабораторная работа
  /progress                  → Моя статистика
  /labs                      → Мои лабораторные
  /settings                  → Настройки профиля
  /certificate               → Сертификат
  /glossary                  → Глоссарий

/teacher/
  /                          → Дашборд преподавателя
  /content                   → Управление контентом
  /content/module/new        → Создание модуля
  /content/module/:id/edit   → Редактирование модуля
  /content/topic/new         → Создание темы
  /content/topic/:id/edit    → Редактирование темы
  /content/test/:id/edit     → Редактирование теста
  /labs                      → Работы на проверку
  /labs/:id                  → Проверка конкретной работы
  /statistics                → Статистика группы
  /students                  → Управление студентами
  /students/new              → Добавление студента
  /students/:id              → Карточка студента

/admin/
  /                          → Панель администратора
  /users                     → Управление пользователями
  /logs                      → Системные логи
  /settings                  → Настройки системы
  /backup                    → Резервное копирование
```

### Layout студента

```
┌─────────────────────────────────────────────────────────┐
│  Logo   Модули  Прогресс  Лабы  ▼ User                  │  ← Header (sticky)
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────────────────────┐ │
│ │ Оглавление│ │                                        │ │
│ │          │ │  Контент темы / Тест / Лаба            │ │
│ │ • Тема 1 │ │                                        │ │
│ │ • Тема 2 │ │                                        │ │
│ │ • Тема 3 │ │                                        │ │
│ │   ...    │ │                                        │ │
│ └──────────┘ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ← Предыдущая                        Следующая →         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Функциональность

### 4.1 Аутентификация

| Функция | Описание | Валидация |
|---------|----------|-----------|
| Регистрация | Email, пароль (8+ символов, буквы и цифры), ФИО | Email уникален |
| Подтверждение email | Ссылка с токеном, 24 часа validity | Токен одноразовый |
| Вход | Email + пароль | Локальная блокировка 5 попыток |
| Refresh token | 7 дней, httpOnly cookie | Автоматическое обновление |
| Выход | Инвалидация refresh token | Session clear |
| Восстановление пароля | Email → ссылка → ввод нового пароля | Токен 1 час |

### 4.2 Модули и темы

| Элемент | Поля | Ограничения |
|---------|------|-------------|
| Модуль | title, description, order, is_published | max 50 модулей |
| Тема | title, content (Markdown/HTML), order, module_id, has_test, has_lab, passing_score | max 100 тем на модуль |
| Файл темы | name, file_path, file_type, size | max 50MB, pdf/docx/xlsx/img |

**Контент темы поддерживает:**
- Заголовки H1-H6
- Списки (маркированные, нумерованные)
- Таблицы
- Блоки кода с подсветкой синтаксиса
- Изображения
- Видео (iframe YouTube или загруженные)
- Ссылки на скачивание

### 4.3 Тестирование

**Типы вопросов:**

| Тип | Описание | Структура ответа |
|-----|---------|------------------|
| single | Одиночный выбор | { question_id, selected_option_id } |
| multiple | Множественный выбор | { question_id, selected_option_ids: [] } |
| matching | Сопоставление | { question_id, pairs: [{term_id, definition_id}] } |
| text | Текстовый ответ | { question_id, answer_text } |

**Подсчёт баллов:**
- single: 1 балл за правильный ответ
- multiple: 1/количество_вариантов за каждый правильно выбранный, 0 за неправильно выбранные
- matching: 1 балл за каждую верную пару
- text: 1 балл если совпадает с одним из ключевых слов

**Ограничения теста:**
- time_limit: nullable (минуты)
- max_attempts: unlimited
- passing_score: 0-100% (по умолчанию 70%)
- shuffle_questions: bool
- shuffle_options: bool

**Результаты теста:**
```json
{
  "attempt_id": "uuid",
  "total_score": 85,
  "passed": true,
  "questions": [
    { "id": "q1", "type": "single", "correct": true, "user_answer": 2, "correct_answer": 2 },
    { "id": "q2", "type": "multiple", "correct": false, "user_answer": [1,2], "correct_answer": [1,3] },
    ...
  ]
}
```

### 4.4 Лабораторные работы

**Структура:**
- title, description (rich text)
- requirements (список требований)
- max_score (по умолчанию 100)
- allowed_extensions: ["pdf", "docx", "zip", "rar"]
- max_file_size: 100MB
- sample_files: [] (необязательно)

**Submission:**
- file_path, submitted_at, status (pending/approved/needs_revision)
- graded_at, grade (0-max_score), feedback

### 4.5 Прогресс-бар

| Статус темы | Цвет | Условие |
|-------------|------|---------|
| not_started | Серый (#9ca3af) | Тема не открывалась |
| in_progress | Жёлтый (#f59e0b) | Открыта, но тест не сдан |
| completed | Зелёный (#10b981) | Тест сдан (≥ passing_score) |

**Расчёт общего прогресса:** (completed_topics / total_topics) * 100%

### 4.6 Чат/форум (дополнительно)

| Функция | Описание |
|---------|----------|
| Комментарии к теме | Студенты задают вопросы под темой |
| Ответы | Преподаватель или другие студенты отвечают |
| Уведомления | Новый комментарий → email/UI notification |

---

## 5. Компоненты UI

### Кнопки

| Вариант | Использование |
|---------|---------------|
| primary | Главные действия (войти, сохранить) |
| secondary | Вторичные действия (отмена) |
| ghost | Навигация, ссылки |
| danger | Удаление, сброс |

**Состояния:** default, hover (scale 1.02, тень), active (scale 0.98), disabled (opacity 0.5), loading (spinner)

### Карточки

```tsx
<Card>
  <CardHeader>Заголовок</CardHeader>
  <CardBody>Содержимое</CardBody>
  <CardFooter>Действия</CardFooter>
</Card>
```

### Формы

- Input: border 1px solid border-color, focus ring primary
- Textarea: resizable vertical, min-height 120px
- Select: custom dropdown с поиском
- Checkbox/Radio: custom styled с анимацией
- File upload: drag-and-drop zone, preview

### Модальные окна

- Backdrop: rgba(0,0,0,0.5), blur(4px)
- Container: max-width 500px, centered, padding 24px
- Animation: scale + fade
- Close: кнопка X, клик по backdrop, Escape

### Уведомления (Toast)

- Position: bottom-right
- Types: success (green), error (red), warning (yellow), info (blue)
- Auto-dismiss: 5 секунд
- Manual dismiss: кнопка X

### Skeleton Loaders

- Прямоугольники с shimmer-анимацией
- Используются для: карточек, текста, изображений

---

## 6. API Endpoints

### Auth
```
POST   /api/auth/register          → { email, password, name }
POST   /api/auth/login             → { email, password } → { access_token, refresh_token }
POST   /api/auth/refresh           → (cookie) → { access_token }
POST   /api/auth/logout            → invalidate tokens
POST   /api/auth/confirm-email     → { token }
POST   /api/auth/forgot-password    → { email }
POST   /api/auth/reset-password     → { token, new_password }
GET    /api/auth/me                → current user
```

### Modules & Topics
```
GET    /api/modules                → list of modules with topics
GET    /api/modules/:id            → module detail with topics
POST   /api/modules                → create module (teacher+)
PUT    /api/modules/:id           → update module
DELETE /api/modules/:id           → delete module
GET    /api/topics/:id             → topic with content
GET    /api/topics/:id/progress    → user progress for topic
POST   /api/topics                → create topic (teacher+)
PUT    /api/topics/:id            → update topic
DELETE /api/topics/:id            → delete topic
```

### Tests
```
GET    /api/topics/:id/test        → test questions (shuffled if enabled)
POST   /api/topics/:id/test/submit → { answers: [] } → { score, passed, details }
GET    /api/tests/history          → user's test history
GET    /api/tests/:id/result       → detailed result
```

### Labs
```
GET    /api/topics/:id/lab         → lab assignment
POST   /api/topics/:id/lab/submit  → upload file
GET    /api/labs/my               → my submissions
GET    /api/labs/:id              → submission detail
PUT    /api/labs/:id/grade        → grade submission (teacher+)
```

### Progress
```
GET    /api/progress               → overall progress
GET    /api/progress/stats         → detailed statistics
GET    /api/progress/topic/:id     → progress for specific topic
```

### Teacher
```
GET    /api/teacher/labs          → all pending labs
GET    /api/teacher/stats         → group statistics
GET    /api/teacher/students      → list of students
POST   /api/teacher/students      → add student
GET    /api/teacher/students/:id/progress → student detailed progress
POST   /api/teacher/export       → generate Excel report
```

### Admin
```
GET    /api/admin/users           → all users
PUT    /api/admin/users/:id/role  → change role
GET    /api/admin/logs            → system logs
GET    /api/admin/settings        → app settings
PUT    /api/admin/settings        → update settings
POST   /api/admin/backup          → create backup
```

---

## 7. Модель данных (SQLAlchemy)

### Users
```python
id: UUID (PK)
email: String (unique, indexed)
password_hash: String
name: String
role: Enum (student, teacher, admin)
avatar_url: String (nullable)
is_active: Boolean (default True)
is_email_confirmed: Boolean (default False)
group_id: UUID (FK, nullable)
created_at: DateTime
updated_at: DateTime
```

### Modules
```python
id: UUID (PK)
title: String
description: Text (nullable)
order: Integer
is_published: Boolean (default True)
created_by: UUID (FK)
created_at: DateTime
updated_at: DateTime
```

### Topics
```python
id: UUID (PK)
module_id: UUID (FK)
title: String
content: Text (Markdown/HTML)
order: Integer
has_test: Boolean (default True)
has_lab: Boolean (default False)
passing_score: Integer (default 70)
time_limit: Integer (nullable, minutes)
created_at: DateTime
updated_at: DateTime
```

### Tests
```python
id: UUID (PK)
topic_id: UUID (FK, unique)
questions: JSON (array of question objects)
shuffle_questions: Boolean
shuffle_options: Boolean
passing_score: Integer
```

### TestAttempts
```python
id: UUID (PK)
user_id: UUID (FK)
topic_id: UUID (FK)
score: Float (percentage)
passed: Boolean
answers: JSON
time_spent: Integer (seconds)
created_at: DateTime
```

### Labs
```python
id: UUID (PK)
topic_id: UUID (FK)
title: String
description: Text
requirements: JSON (array)
max_score: Integer
allowed_extensions: JSON (array)
created_at: DateTime
```

### LabSubmissions
```python
id: UUID (PK)
lab_id: UUID (FK)
user_id: UUID (FK)
file_path: String
file_name: String
status: Enum (pending, approved, needs_revision)
grade: Integer (nullable)
feedback: Text (nullable)
submitted_at: DateTime
graded_at: DateTime (nullable)
graded_by: UUID (FK, nullable)
```

### TopicProgress
```python
id: UUID (PK)
user_id: UUID (FK)
topic_id: UUID (FK)
status: Enum (not_started, in_progress, completed)
best_test_score: Float (nullable)
completed_at: DateTime (nullable)
```

### Comments
```python
id: UUID (PK)
topic_id: UUID (FK)
user_id: UUID (FK)
content: Text
parent_id: UUID (FK, nullable)  # для ответов
created_at: DateTime
updated_at: DateTime
```

### Groups
```python
id: UUID (PK)
name: String
created_at: DateTime
```

### RefreshTokens
```python
id: UUID (PK)
user_id: UUID (FK)
token: String (unique)
expires_at: DateTime
created_at: DateTime
```

---

## 8. Технический стек

### Backend
- **Framework:** FastAPI
- **Database:** PostgreSQL (SQLAlchemy + Alembic)
- **Cache:** Redis
- **Background tasks:** Celery + Redis
- **Auth:** python-jose (JWT), passlib (bcrypt)
- **File storage:** Local filesystem (uploads/)
- **Excel generation:** openpyxl
- **PDF generation:** reportlab

### Frontend
- **Framework:** React 18 + TypeScript
- **Router:** React Router v6
- **State:** Zustand (global), React Query (server state)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **UI Components:** shadcn/ui (based on Radix)
- **Charts:** Chart.js + react-chartjs-2
- **Rich Text:** React Quill или TipTap
- **Icons:** Lucide React

### Infrastructure
- **Dev:** Docker Compose (postgres, redis, backend, frontend)
- **CI/CD:** GitHub Actions (опционально)

---

## 9. Производительность и безопасность

### Производительность
- Кэширование оглавления и глоссария в Redis (TTL: 1 час)
- Пагинация для списков (20 элементов по умолчанию)
- Lazy loading для изображений и тяжёлого контента
- Оптимистичные UI updates

### Безопасность
- CSRF tokens для форм
- CORS whitelist
- XSS sanitization (DOMPurify для HTML контента)
- Rate limiting (100 req/min для API)
- Input validation (Zod schemas)
- Password hashing: bcrypt (cost 12)
- JWT: 15 min access, 7 days refresh

### Логирование
- Уровни: DEBUG, INFO, WARNING, ERROR
- Формат: timestamp + level + user_id + action + details
- Ротация: ежедневно, хранить 30 дней

---

## 10. Развертывание

### Требования
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Environment variables
```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/textbook
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8000
```

### Команды запуска
```bash
# Development
cd backend && uvicorn main:app --reload
cd frontend && npm run dev

# Production
docker-compose up -d
```