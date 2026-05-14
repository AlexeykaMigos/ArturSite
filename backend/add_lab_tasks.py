import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.content import Lab, LabTask
from datetime import datetime

def add_lab_tasks():
    db = SessionLocal()
    
    try:
        labs = db.query(Lab).all()
        print(f"Found {len(labs)} labs")
        
        for lab in labs:
            # Check if tasks already exist
            existing_tasks = db.query(LabTask).filter(LabTask.lab_id == lab.id).count()
            if existing_tasks > 0:
                print(f"Lab '{lab.title}' already has {existing_tasks} tasks. Skipping.")
                continue
            
            print(f"Adding tasks to lab: {lab.title}")
            
            # Create lab tasks based on topic title
            lab_tasks = []
            if "Переменные и типы данных" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание переменных", "description": "Создайте переменные разных типов данных (int, float, str, bool) и выведите их на экран.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Операции с переменными", "description": "Выполните арифметические операции с созданными переменными (сложение, вычитание, умножение, деление).", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Преобразование типов", "description": "Преобразуйте переменные между разными типами данных и объясните результат.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Ввод данных", "description": "Напишите программу для ввода данных от пользователя и их обработки.", "order": 4, "max_score": 25},
                ]
            elif "Условные операторы" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Простое условие", "description": "Напишите программу, которая проверяет число и выводит сообщение о том, положительное оно или отрицательное.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Вложенные условия", "description": "Создайте программу с вложенными if-else для проверки нескольких условий.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Логические операторы", "description": "Используйте логические операторы (and, or, not) для сложных проверок.", "order": 3, "max_score": 34},
                ]
            elif "Циклы" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Цикл for", "description": "Используйте цикл for для перебора элементов списка и выполнения операций.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Цикл while", "description": "Реализуйте задачу с использованием цикла while с условием выхода.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Вложенные циклы", "description": "Создайте программу с вложенными циклами для обработки двумерных структур.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: break и continue", "description": "Используйте операторы break и continue для управления выполнением циклов.", "order": 4, "max_score": 25},
                ]
            elif "Списки" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание списка", "description": "Создайте список с различными типами данных и выполните базовые операции.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Методы списков", "description": "Используйте методы append, insert, remove, pop для работы со списком.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Срезы", "description": "Работайте со срезами списков для получения подмножеств элементов.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Генераторы списков", "description": "Используйте генераторы списков для создания новых списков.", "order": 4, "max_score": 25},
                ]
            elif "Словари" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание словаря", "description": "Создайте словарь с парами ключ-значение и выполните базовые операции.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Методы словарей", "description": "Используйте методы keys(), values(), items() для работы со словарем.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Вложенные словари", "description": "Работайте с вложенными словарями для хранения сложных структур.", "order": 3, "max_score": 34},
                ]
            elif "Множества" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Создание множеств", "description": "Создайте множества из списков и выполните базовые операции.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: Операции над множествами", "description": "Используйте операции объединения, пересечения, разности множеств.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Практическое применение", "description": "Решите задачу с использованием множеств для поиска уникальных элементов.", "order": 3, "max_score": 34},
                ]
            elif "Сортировка" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Пузырьковая сортировка", "description": "Реализуйте пузырьковую сортировку и протестируйте её на разных данных.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: Быстрая сортировка", "description": "Реализуйте быструю сортировку с использованием рекурсии.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: Сортировка слиянием", "description": "Реализуйте сортировку слиянием и сравните её эффективность.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Сравнение алгоритмов", "description": "Сравните время выполнения разных алгоритмов сортировки.", "order": 4, "max_score": 25},
                ]
            elif "Поиск" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Линейный поиск", "description": "Реализуйте линейный поиск и подсчитайте количество сравнений.", "order": 1, "max_score": 50},
                    {"title": "Задача 2: Бинарный поиск", "description": "Реализуйте бинарный поиск для отсортированного массива.", "order": 2, "max_score": 50},
                ]
            elif "Основы SQL" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: CREATE TABLE", "description": "Создайте таблицу с различными типами данных и ограничениями.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: INSERT и SELECT", "description": "Добавьте данные в таблицу и выполните различные запросы SELECT.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: UPDATE и DELETE", "description": "Обновите и удалите данные с использованием соответствующих команд.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: JOIN", "description": "Создайте несколько таблиц и выполните запросы с JOIN.", "order": 4, "max_score": 25},
                ]
            elif "HTML и CSS" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: HTML структура", "description": "Создайте HTML страницу с семантическими тегами и правильной структурой.", "order": 1, "max_score": 33},
                    {"title": "Задача 2: CSS стилизация", "description": "Добавьте стили CSS для оформления HTML страницы.", "order": 2, "max_score": 33},
                    {"title": "Задача 3: Flexbox layout", "description": "Используйте Flexbox для создания адаптивного макета страницы.", "order": 3, "max_score": 34},
                ]
            elif "JavaScript" in lab.title:
                lab_tasks = [
                    {"title": "Задача 1: Основы JS", "description": "Напишите JavaScript код для работы с переменными и функциями.", "order": 1, "max_score": 25},
                    {"title": "Задача 2: DOM манипуляции", "description": "Используйте JavaScript для изменения элементов DOM.", "order": 2, "max_score": 25},
                    {"title": "Задача 3: События", "description": "Добавьте обработчики событий для интерактивности страницы.", "order": 3, "max_score": 25},
                    {"title": "Задача 4: Асинхронность", "description": "Используйте промисы и async/await для асинхронных операций.", "order": 4, "max_score": 25},
                ]
            else:
                # Default tasks for other labs
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
            
            print(f"Added {len(lab_tasks)} tasks to lab: {lab.title}")
        
        db.commit()
        print("Lab tasks added successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding lab tasks: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_lab_tasks()
