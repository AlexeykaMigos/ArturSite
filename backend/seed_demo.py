import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.content import Module, Topic, Test, Lab, LabTask, GlossaryTerm, TopicProgress, TestAttempt, LabSubmission
import uuid
from datetime import datetime

def seed_database():
    db = SessionLocal()
    
    try:
        # Check if demo data already exists
        existing_modules = db.query(Module).count()
        if existing_modules > 5:
            print(f"Database already has {existing_modules} modules. Skipping seed.")
            return
        
        print("Seeding database with demo content...")
        
        # Create demo users
        admin_user = User(
            email="admin@demo.com",
            name="Admin User",
            password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY8xOxO4.2W",  # password: admin123
            role=UserRole.ADMIN,
            is_active=True,
            is_email_confirmed=True
        )
        db.add(admin_user)
        
        teacher_user = User(
            email="teacher@demo.com",
            name="Teacher User",
            password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY8xOxO4.2W",  # password: admin123
            role=UserRole.TEACHER,
            is_active=True,
            is_email_confirmed=True
        )
        db.add(teacher_user)
        
        student_user = User(
            email="student@demo.com",
            name="Student User",
            password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY8xOxO4.2W",  # password: admin123
            role=UserRole.STUDENT,
            is_active=True,
            is_email_confirmed=True
        )
        db.add(student_user)
        db.flush()
        
        # Create modules
        modules_data = [
            {"title": "Введение в программирование", "description": "Основы программирования и алгоритмы", "order": 1},
            {"title": "Структуры данных", "description": "Массивы, списки, деревья и графы", "order": 2},
            {"title": "Алгоритмы", "description": "Сортировка, поиск и оптимизация", "order": 3},
            {"title": "Базы данных", "description": "SQL и NoSQL базы данных", "order": 4},
            {"title": "Веб-разработка", "description": "Frontend и Backend технологии", "order": 5},
        ]
        
        modules = []
        for mod_data in modules_data:
            module = Module(
                title=mod_data["title"],
                description=mod_data["description"],
                order=mod_data["order"]
            )
            db.add(module)
            modules.append(module)
        db.flush()
        
        # Create topics for each module
        topics_data = [
            # Module 1: Введение в программирование
            {
                "module_id": modules[0].id,
                "title": "Переменные и типы данных",
                "content": "Переменные - это контейнеры для хранения данных. В Python есть несколько базовых типов: int (целые числа), float (числа с плавающей точкой), str (строки), bool (логические значения).",
                "order": 1,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 15
            },
            {
                "module_id": modules[0].id,
                "title": "Условные операторы",
                "content": "Условные операторы позволяют выполнять разные действия в зависимости от условий. Основные конструкции: if, elif, else. Логические операторы: and, or, not.",
                "order": 2,
                "has_test": True,
                "has_lab": False,
                "passing_score": 70,
                "time_limit": 10
            },
            {
                "module_id": modules[0].id,
                "title": "Циклы",
                "content": "Циклы позволяют многократно выполнять блок кода. В Python есть два основных типа циклов: for (для итерации по последовательности) и while (пока условие истинно).",
                "order": 3,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 20
            },
            # Module 2: Структуры данных
            {
                "module_id": modules[1].id,
                "title": "Списки",
                "content": "Списки - это упорядоченные изменяемые коллекции элементов. Они могут содержать элементы разных типов. Основные операции: добавление, удаление, доступ по индексу.",
                "order": 1,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 15
            },
            {
                "module_id": modules[1].id,
                "title": "Словари",
                "content": "Словари - это коллекции пар ключ-значение. Ключи должны быть уникальными и неизменяемыми. Словари обеспечивают быстрый доступ к данным по ключу.",
                "order": 2,
                "has_test": True,
                "has_lab": False,
                "passing_score": 70,
                "time_limit": 10
            },
            {
                "module_id": modules[1].id,
                "title": "Множества",
                "content": "Множества - это неупорядоченные коллекции уникальных элементов. Они поддерживают математические операции: объединение, пересечение, разность.",
                "order": 3,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 15
            },
            # Module 3: Алгоритмы
            {
                "module_id": modules[2].id,
                "title": "Сортировка",
                "content": "Алгоритмы сортировки упорядочивают элементы. Популярные алгоритмы: пузырьковая сортировка, быстрая сортировка, сортировка слиянием. Сложность: O(n log n) для эффективных алгоритмов.",
                "order": 1,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 20
            },
            {
                "module_id": modules[2].id,
                "title": "Поиск",
                "content": "Алгоритмы поиска находят элементы в структурах данных. Линейный поиск: O(n). Бинарный поиск: O(log n), но требует отсортированного массива.",
                "order": 2,
                "has_test": True,
                "has_lab": False,
                "passing_score": 70,
                "time_limit": 15
            },
            # Module 4: Базы данных
            {
                "module_id": modules[3].id,
                "title": "Основы SQL",
                "content": "SQL - язык структурированных запросов. Основные команды: SELECT (выборка), INSERT (вставка), UPDATE (обновление), DELETE (удаление). JOIN для объединения таблиц.",
                "order": 1,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 20
            },
            {
                "module_id": modules[3].id,
                "title": "Реляционные базы данных",
                "content": "Реляционные базы данных организуют данные в таблицы с связями. Основные понятия: первичный ключ, внешний ключ, нормализация, транзакции.",
                "order": 2,
                "has_test": True,
                "has_lab": False,
                "passing_score": 70,
                "time_limit": 15
            },
            # Module 5: Веб-разработка
            {
                "module_id": modules[4].id,
                "title": "HTML и CSS",
                "content": "HTML определяет структуру веб-страницы. CSS отвечает за стилизацию и расположение элементов. Flexbox и Grid для создания сложных макетов.",
                "order": 1,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 15
            },
            {
                "module_id": modules[4].id,
                "title": "JavaScript",
                "content": "JavaScript - язык программирования для веб. Поддерживает объектно-ориентированное и функциональное программирование. DOM манипуляции, асинхронность, промисы.",
                "order": 2,
                "has_test": True,
                "has_lab": True,
                "passing_score": 70,
                "time_limit": 20
            },
        ]
        
        topics = []
        for topic_data in topics_data:
            topic = Topic(**topic_data)
            db.add(topic)
            topics.append(topic)
        db.flush()
        
        # Create tests for topics
        for topic in topics:
            if not topic.has_test:
                continue
            
            questions = []
            
            # Add single choice questions
            questions.append({
                "id": f"q_{topic.id}_1",
                "type": "single",
                "text": f"Что является основным понятием в теме '{topic.title}'?",
                "options": [
                    {"id": "opt1", "text": "Переменная", "is_correct": True},
                    {"id": "opt2", "text": "Функция", "is_correct": False},
                    {"id": "opt3", "text": "Класс", "is_correct": False},
                    {"id": "opt4", "text": "Модуль", "is_correct": False}
                ]
            })
            
            # Add multiple choice questions
            questions.append({
                "id": f"q_{topic.id}_2",
                "type": "multiple",
                "text": f"Выберите правильные утверждения о '{topic.title}':",
                "options": [
                    {"id": "opt1", "text": "Это важная концепция", "is_correct": True},
                    {"id": "opt2", "text": "Используется редко", "is_correct": False},
                    {"id": "opt3", "text": "Имеет практическое применение", "is_correct": True},
                    {"id": "opt4", "text": "Устарела", "is_correct": False}
                ]
            })
            
            # Add text question
            questions.append({
                "id": f"q_{topic.id}_3",
                "type": "text",
                "text": f"Напишите ключевое слово, связанное с '{topic.title}':",
                "correct_keywords": ["программирование", "код", "алгоритм", "данные"]
            })
            
            # Add matching question
            questions.append({
                "id": f"q_{topic.id}_4",
                "type": "matching",
                "text": f"Сопоставьте термины с определениями для '{topic.title}':",
                "matching_terms": [
                    {"id": "t1", "text": "Концепция"},
                    {"id": "t2", "text": "Применение"},
                    {"id": "t3", "text": "Пример"}
                ],
                "matching_definitions": [
                    {"id": "d1", "text": "Основная идея"},
                    {"id": "d2", "text": "Использование на практике"},
                    {"id": "d3", "text": "Конкретный случай"}
                ],
                "matching_pairs": [
                    {"term_id": "t1", "definition_id": "d1"},
                    {"term_id": "t2", "definition_id": "d2"},
                    {"term_id": "t3", "definition_id": "d3"}
                ]
            })
            
            test = Test(
                topic_id=topic.id,
                questions=questions,
                shuffle_questions=False,
                shuffle_options=False,
                passing_score=topic.passing_score
            )
            db.add(test)
        
        # Create labs for topics
        for topic in topics:
            if not topic.has_lab:
                continue
            
            lab = Lab(
                topic_id=topic.id,
                title=f"Лабораторная работа: {topic.title}",
                description=f"Практическое задание по теме '{topic.title}'. Реализуйте основные концепции на примере.",
                requirements=["1. Изучите материал темы", "2. Выполните задание", "3. Подготовьте отчет", "4. Загрузите решение"],
                max_score=100,
                allowed_extensions=[".py", ".txt", ".pdf", ".zip"]
            )
            db.add(lab)
            db.flush()
            
            # Create lab tasks based on topic
            lab_tasks = []
            if "Переменные и типы данных" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание переменных", "description": "Создайте переменные разных типов данных (int, float, str, bool) и выведите их на экран.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Операции с переменными", "description": "Выполните арифметические операции с созданными переменными (сложение, вычитание, умножение, деление).", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Преобразование типов", "description": "Преобразуйте переменные между разными типами данных и объясните результат.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Ввод данных", "description": "Напишите программу для ввода данных от пользователя и их обработки.", "order": 4, "max_score": 25},
                ]
            elif "Условные операторы" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Простое условие", "description": "Напишите программу, которая проверяет число и выводит сообщение о том, положительное оно или отрицательное.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Вложенные условия", "description": "Создайте программу с вложенными if-else для проверки нескольких условий.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Логические операторы", "description": "Используйте логические операторы (and, or, not) для сложных проверок.", "order": 3, "max_score": 34},
                ]
            elif "Циклы" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Цикл for", "description": "Используйте цикл for для перебора элементов списка и выполнения операций.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Цикл while", "description": "Реализуйте задачу с использованием цикла while с условием выхода.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Вложенные циклы", "description": "Создайте программу с вложенными циклами для обработки двумерных структур.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: break и continue", "description": "Используйте операторы break и continue для управления выполнением циклов.", "order": 4, "max_score": 25},
                ]
            elif "Списки" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание списка", "description": "Создайте список с различными типами данных и выполните базовые операции.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Методы списков", "description": "Используйте методы append, insert, remove, pop для работы со списком.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Срезы", "description": "Работайте со срезами списков для получения подмножеств элементов.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Генераторы списков", "description": "Используйте генераторы списков для создания новых списков.", "order": 4, "max_score": 25},
                ]
            elif "Словари" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание словаря", "description": "Создайте словарь с парами ключ-значение и выполните базовые операции.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Методы словарей", "description": "Используйте методы keys(), values(), items() для работы со словарем.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Вложенные словари", "description": "Работайте с вложенными словарями для хранения сложных структур.", "order": 3, "max_score": 34},
                ]
            elif "Множества" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание множеств", "description": "Создайте множества из списков и выполните базовые операции.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Операции над множествами", "description": "Используйте операции объединения, пересечения, разности множеств.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Практическое применение", "description": "Решите задачу с использованием множеств для поиска уникальных элементов.", "order": 3, "max_score": 34},
                ]
            elif "Сортировка" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Пузырьковая сортировка", "description": "Реализуйте пузырьковую сортировку и протестируйте её на разных данных.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Быстрая сортировка", "description": "Реализуйте быструю сортировку с использованием рекурсии.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Сортировка слиянием", "description": "Реализуйте сортировку слиянием и сравните её эффективность.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Сравнение алгоритмов", "description": "Сравните время выполнения разных алгоритмов сортировки.", "order": 4, "max_score": 25},
                ]
            elif "Поиск" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Линейный поиск", "description": "Реализуйте линейный поиск и подсчитайте количество сравнений.", "order": 1, "max_score": 50},
                    {"title": "Задача 2: Бинарный поиск", "description": "Реализуйте бинарный поиск для отсортированного массива.", "order": 2, "max_score": 50},
                ]
            elif "Основы SQL" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: CREATE TABLE", "description": "Создайте таблицу с различными типами данных и ограничениями.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: INSERT и SELECT", "description": "Добавьте данные в таблицу и выполните различные запросы SELECT.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: UPDATE и DELETE", "description": "Обновите и удалите данные с использованием соответствующих команд.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: JOIN", "description": "Создайте несколько таблиц и выполните запросы с JOIN.", "order": 4, "max_score": 25},
                ]
            elif "HTML и CSS" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: HTML структура", "description": "Создайте HTML страницу с семантическими тегами и правильной структурой.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: CSS стилизация", "description": "Добавьте стили CSS для оформления HTML страницы.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Flexbox layout", "description": "Используйте Flexbox для создания адаптивного макета страницы.", "order": 3, "max_score": 34},
                ]
            elif "JavaScript" in topic.title:
                lab_tasks = [
                    {"title": "Задача 1: Основы JS", "description": "Напишите JavaScript код для работы с переменными и функциями.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: DOM манипуляции", "description": "Используйте JavaScript для изменения элементов DOM.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: События", "description": "Добавьте обработчики событий для интерактивности страницы.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Асинхронность", "description": "Используйте промисы и async/await для асинхронных операций.", "order": 4, "max_score": 25},
                ]
            else:
                # Default tasks for other topics
                lab_tasks = [
                    {"title": "Задача 1: Изучение материала", "description": "Изучите теоретический материал по теме и подготовьте конспект.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Практическое применение", "description": "Выполните практическое задание для закрепления материала.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Анализ и отчет", "description": "Проанализируйте результаты и подготовьте отчет.", "order": 3, "max_score": 34},
                ]
            
            for task_data in lab_tasks:
                task = LabTask(
                    lab_id=lab.id,
                    title=task_data["title"],
                    description=task_data["description"],
                    order=task_data["order"],
                    max_score=task_data["max_score"]
                )
                db.add(task)
        
        # Create glossary terms
        glossary_terms = [
            {"term": "Переменная", "definition": "Именованная область памяти для хранения данных"},
            {"term": "Функция", "definition": "Блок кода, выполняющий определенную задачу"},
            {"term": "Массив", "definition": "Упорядоченная коллекция элементов одного типа"},
            {"term": "Словарь", "definition": "Коллекция пар ключ-значение"},
            {"term": "Алгоритм", "definition": "Последовательность шагов для решения задачи"},
            {"term": "Сортировка", "definition": "Процесс упорядочивания элементов"},
            {"term": "База данных", "definition": "Организованная коллекция данных"},
            {"term": "SQL", "definition": "Язык структурированных запросов"},
            {"term": "API", "definition": "Интерфейс программирования приложений"},
            {"term": "DOM", "definition": "Объектная модель документа"},
        ]
        
        for term_data in glossary_terms:
            term = GlossaryTerm(
                term=term_data["term"],
                definition=term_data["definition"]
            )
            db.add(term)
        
        db.commit()
        print("Database seeded successfully!")
        print(f"Created {len(modules)} modules")
        print(f"Created {len(topics)} topics")
        print(f"Created lab tasks for labs")
        print(f"Created 3 users (admin@demo.com, teacher@demo.com, student@demo.com)")
        print("Default password for all users: admin123")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed data
    seed_database()
