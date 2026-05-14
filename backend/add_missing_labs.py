"""Add labs to topics that are missing them."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.content import Topic, Lab, LabTask

EXTRA_LABS = {
    "Условные операторы": {
        "description": "Практическое задание по написанию программ с условной логикой на Python.",
        "tasks": [
            {"title": "Задача 1: Калькулятор оценки", "description": "Напишите программу, которая принимает балл от 0 до 100 и выводит оценку (5,4,3,2).", "order": 1, "max_score": 34},
            {"title": "Задача 2: Классификатор", "description": "Классифицируйте введённое пользователем число: положительное/отрицательное/нулевое, чётное/нечётное.", "order": 2, "max_score": 33},
            {"title": "Задача 3: Логические операторы", "description": "Создайте программу проверки доступа: пользователь должен быть активен И иметь роль admin ИЛИ teacher.", "order": 3, "max_score": 33},
        ]
    },
    "Словари": {
        "description": "Практическое задание по работе со словарями Python.",
        "tasks": [
            {"title": "Задача 1: Телефонная книга", "description": "Реализуйте простую телефонную книгу (словарь) с операциями добавления, удаления и поиска контакта.", "order": 1, "max_score": 33},
            {"title": "Задача 2: Частотный анализ", "description": "Подсчитайте частоту каждого слова в тексте, используя словарь. Выведите топ-5 самых частых слов.", "order": 2, "max_score": 34},
            {"title": "Задача 3: Конфигурация", "description": "Создайте словарь конфигурации приложения и напишите функции чтения/записи значений.", "order": 3, "max_score": 33},
        ]
    },
    "Поиск": {
        "description": "Практическое задание по реализации алгоритмов поиска.",
        "tasks": [
            {"title": "Задача 1: Линейный поиск с подсчётом", "description": "Реализуйте линейный поиск, который возвращает индекс элемента и количество сделанных сравнений.", "order": 1, "max_score": 34},
            {"title": "Задача 2: Бинарный поиск", "description": "Реализуйте итеративный бинарный поиск. Убедитесь, что данные отсортированы перед поиском.", "order": 2, "max_score": 33},
            {"title": "Задача 3: Сравнение производительности", "description": "Измерьте время работы обоих алгоритмов на массиве из 100 000 элементов. Постройте сравнительную таблицу.", "order": 3, "max_score": 33},
        ]
    },
    "Реляционные базы данных": {
        "description": "Практическое задание по проектированию реляционных баз данных.",
        "tasks": [
            {"title": "Задача 1: Схема базы данных", "description": "Спроектируйте ER-диаграмму для системы учёта студентов (студенты, курсы, оценки). Укажите ключи и связи.", "order": 1, "max_score": 34},
            {"title": "Задача 2: Нормализация", "description": "Приведите исходную таблицу к 3НФ. Опишите каждый шаг нормализации.", "order": 2, "max_score": 33},
            {"title": "Задача 3: Транзакции", "description": "Напишите SQL-транзакцию перевода средств между счетами с обработкой ошибок и ROLLBACK.", "order": 3, "max_score": 33},
        ]
    },
}

def add_labs():
    db = SessionLocal()
    try:
        topics = db.query(Topic).all()
        added = 0
        for topic in topics:
            if topic.title not in EXTRA_LABS:
                continue
            # Check if lab already exists
            existing = db.query(Lab).filter(Lab.topic_id == topic.id).first()
            if existing:
                print(f"Lab already exists for: {topic.title}")
                continue

            cfg = EXTRA_LABS[topic.title]
            lab = Lab(
                topic_id=topic.id,
                title=f"Лабораторная работа: {topic.title}",
                description=cfg["description"],
                requirements=[
                    "Изучите теоретический материал темы",
                    "Выполните все задачи по порядку",
                    "Подготовьте отчёт с кодом и выводами",
                    "Загрузите архив (.zip) или Python-файл (.py)",
                ],
                max_score=100,
                allowed_extensions=[".py", ".txt", ".pdf", ".zip", ".docx"],
            )
            db.add(lab)
            db.flush()

            for t in cfg["tasks"]:
                task = LabTask(lab_id=lab.id, **t)
                db.add(task)

            topic.has_lab = True
            added += 1
            print(f"Added lab for: {topic.title}")

        db.commit()
        print(f"\nDone! Added {added} new labs.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_labs()
