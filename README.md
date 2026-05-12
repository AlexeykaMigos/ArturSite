# Электронный учебник «Информационные системы и технологии»

Интерактивное веб-приложение для онлайн-обучения с поддержкой трёх ролей пользователей.

## Стек технологий

### Backend
- FastAPI (Python 3.11+)
- SQLAlchemy + PostgreSQL
- Redis для кэширования
- JWT аутентификация

### Frontend
- React 18 + TypeScript
- React Router v6
- Zustand (state management)
- React Query (server state)
- Tailwind CSS

## Запуск

### Docker Compose (рекомендуется)

```bash
docker-compose up -d
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Ручной запуск

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Роли пользователей

| Роль | Описание |
|------|----------|
| student | Изучение материалов, прохождение тестов, загрузка лабораторных |
| teacher | Управление контентом, проверка работ, просмотр статистики |
| admin | Все права teacher + управление пользователями и системой |

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── api/          # API роутеры
│   │   ├── core/         # Конфигурация, БД, безопасность
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── schemas/      # Pydantic схемы
│   │   └── main.py       # Точка входа
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API клиент
│   │   ├── components/   # UI компоненты
│   │   ├── pages/        # Страницы
│   │   ├── stores/       # Zustand хранилища
│   │   └── types/        # TypeScript типы
│   └── package.json
├── docker-compose.yml
├── SPEC.md
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Content
- `GET /api/modules` - Список модулей
- `GET /api/topics/:id` - Тема с контентом
- `POST /api/modules` - Создание модуля (teacher+)

### Tests
- `GET /api/topics/:id/test` - Получить тест
- `POST /api/topics/:id/test/submit` - Отправить ответы

### Labs
- `POST /api/topics/:id/lab/submit` - Загрузить работу
- `PUT /api/labs/:id/grade` - Оценить работу (teacher+)

### Progress
- `GET /api/progress` - Общий прогресс
- `GET /api/progress/stats` - Детальная статистика

### Teacher
- `GET /api/teacher/labs` - Работы на проверку
- `GET /api/teacher/students` - Список студентов
- `GET /api/teacher/stats/overview` - Обзор статистики

### Admin
- `GET /api/admin/users` - Все пользователи
- `PUT /api/admin/users/:id/role` - Изменить роль
- `POST /api/admin/backup` - Создать бэкап