"""Update topic content with rich HTML for better visual experience."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.content import Topic, Module, Lab, LabTask

RICH_CONTENT = {
    "Переменные и типы данных": """
<h2>Что такое переменная?</h2>
<p>
  <strong>Переменная</strong> — это именованная область памяти, в которой хранится значение определённого типа.
  Думайте о ней как о контейнере с подписью: в контейнере лежат данные, а подпись — это имя переменной.
</p>

<h2>Основные типы данных Python</h2>
<ul>
  <li><code>int</code> — целые числа: <code>42</code>, <code>-7</code>, <code>0</code></li>
  <li><code>float</code> — числа с плавающей точкой: <code>3.14</code>, <code>-0.5</code></li>
  <li><code>str</code> — строки текста: <code>"Привет"</code>, <code>'мир'</code></li>
  <li><code>bool</code> — логические значения: <code>True</code> или <code>False</code></li>
  <li><code>NoneType</code> — отсутствие значения: <code>None</code></li>
</ul>

<h2>Объявление переменных</h2>
<pre><code># Целое число
age = 21

# Число с плавающей точкой
pi = 3.14159

# Строка
name = "Алексей"

# Логическое значение
is_student = True

# Проверка типа
print(type(age))    # &lt;class 'int'&gt;
print(type(name))   # &lt;class 'str'&gt;
</code></pre>

<h2>Преобразование типов</h2>
<p>Python позволяет явно преобразовывать значения из одного типа в другой:</p>
<pre><code>x = "42"
print(type(x))         # str

y = int(x)
print(type(y), y)      # int 42

z = float(y)
print(z)               # 42.0

s = str(z)
print(s)               # '42.0'
</code></pre>

<h2>Динамическая типизация</h2>
<p>
  В Python одна и та же переменная может хранить значения разных типов в разные моменты выполнения программы.
  Это называется <strong>динамической типизацией</strong>.
</p>
<pre><code>x = 10
print(x, type(x))   # 10 &lt;class 'int'&gt;

x = "hello"
print(x, type(x))   # hello &lt;class 'str'&gt;
</code></pre>

<blockquote>
  Хорошим стилем считается не менять тип переменной без необходимости — это делает код понятнее.
</blockquote>

<h2>Множественное присваивание</h2>
<pre><code># Присвоить одно значение нескольким переменным
a = b = c = 0

# Присвоить разные значения сразу
x, y, z = 1, 2.5, "три"
print(x, y, z)   # 1 2.5 три
</code></pre>
""",

    "Условные операторы": """
<h2>Зачем нужны условия?</h2>
<p>
  Условные операторы позволяют программе <strong>принимать решения</strong>: выполнять разные действия
  в зависимости от текущих данных.
</p>

<h2>Оператор if / elif / else</h2>
<pre><code>temperature = 25

if temperature &gt; 30:
    print("Жарко! Надень лёгкую одежду.")
elif temperature &gt; 15:
    print("Тепло и комфортно.")
elif temperature &gt; 0:
    print("Прохладно, возьми куртку.")
else:
    print("Мороз! Одевайся теплее.")
</code></pre>

<h2>Операторы сравнения</h2>
<ul>
  <li><code>==</code> — равно</li>
  <li><code>!=</code> — не равно</li>
  <li><code>&gt;</code>, <code>&lt;</code> — больше, меньше</li>
  <li><code>&gt;=</code>, <code>&lt;=</code> — не меньше, не больше</li>
</ul>

<h2>Логические операторы</h2>
<pre><code>age = 20
has_id = True

# and — оба условия должны быть истинны
if age &gt;= 18 and has_id:
    print("Добро пожаловать!")

# or — хотя бы одно условие истинно
if age &lt; 12 or age &gt; 65:
    print("Льготный билет.")

# not — инвертирует условие
if not has_id:
    print("Покажите документ.")
</code></pre>

<h2>Тернарный оператор (условное выражение)</h2>
<pre><code>score = 75
grade = "Зачёт" if score &gt;= 60 else "Незачёт"
print(grade)   # Зачёт
</code></pre>

<h2>Вложенные условия</h2>
<pre><code>x = 15

if x &gt; 0:
    if x % 2 == 0:
        print("Положительное чётное")
    else:
        print("Положительное нечётное")
else:
    print("Не положительное")
</code></pre>
""",

    "Циклы": """
<h2>Зачем нужны циклы?</h2>
<p>
  Цикл позволяет выполнить один и тот же блок кода <strong>многократно</strong>, не дублируя его.
  Python предоставляет два вида циклов: <code>for</code> и <code>while</code>.
</p>

<h2>Цикл for</h2>
<p>Используется для перебора элементов последовательности:</p>
<pre><code># Перебор списка
fruits = ["яблоко", "банан", "вишня"]
for fruit in fruits:
    print(fruit)

# Перебор диапазона чисел
for i in range(5):
    print(i)   # 0, 1, 2, 3, 4

# С начальным значением и шагом
for i in range(1, 10, 2):
    print(i)   # 1, 3, 5, 7, 9
</code></pre>

<h2>Цикл while</h2>
<p>Выполняется, пока условие истинно:</p>
<pre><code>count = 0
while count &lt; 5:
    print(f"Итерация {count}")
    count += 1
</code></pre>

<h2>Управление циклом</h2>
<pre><code># break — прервать цикл досрочно
for i in range(10):
    if i == 5:
        break
    print(i)   # 0, 1, 2, 3, 4

# continue — пропустить текущую итерацию
for i in range(10):
    if i % 2 == 0:
        continue
    print(i)   # 1, 3, 5, 7, 9
</code></pre>

<h2>Вложенные циклы</h2>
<pre><code># Таблица умножения 3×3
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i}×{j}={i*j}", end="  ")
    print()
</code></pre>

<h2>Цикл else</h2>
<pre><code># else выполняется, если цикл завершился без break
for i in range(5):
    print(i)
else:
    print("Цикл завершён нормально")
</code></pre>
""",

    "Списки": """
<h2>Что такое список?</h2>
<p>
  <strong>Список</strong> (<code>list</code>) — это упорядоченная изменяемая коллекция элементов.
  Элементы могут быть любого типа и повторяться.
</p>

<h2>Создание списков</h2>
<pre><code># Пустой список
empty = []

# Список чисел
numbers = [1, 2, 3, 4, 5]

# Смешанный список
mixed = [1, "два", 3.0, True]

# Из range
squares = list(range(1, 6))   # [1, 2, 3, 4, 5]
</code></pre>

<h2>Доступ к элементам</h2>
<pre><code>fruits = ["яблоко", "банан", "вишня", "дыня"]

print(fruits[0])    # яблоко  (первый)
print(fruits[-1])   # дыня    (последний)

# Срезы
print(fruits[1:3])  # ['банан', 'вишня']
print(fruits[:2])   # ['яблоко', 'банан']
print(fruits[::2])  # ['яблоко', 'вишня']  (каждый второй)
</code></pre>

<h2>Основные методы</h2>
<pre><code>lst = [3, 1, 4, 1, 5]

lst.append(9)        # добавить в конец
lst.insert(0, 0)     # вставить по индексу
lst.remove(1)        # удалить первое вхождение
popped = lst.pop()   # удалить и вернуть последний
lst.sort()           # сортировка на месте
lst.reverse()        # разворот на месте
print(len(lst))      # длина списка
</code></pre>

<h2>Генераторы списков</h2>
<pre><code># Квадраты чисел от 0 до 9
squares = [x**2 for x in range(10)]
print(squares)   # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# С условием — только чётные квадраты
even_sq = [x**2 for x in range(10) if x % 2 == 0]
print(even_sq)   # [0, 4, 16, 36, 64]
</code></pre>
""",

    "Словари": """
<h2>Что такое словарь?</h2>
<p>
  <strong>Словарь</strong> (<code>dict</code>) — это неупорядоченная коллекция пар <em>ключ: значение</em>.
  Ключи должны быть уникальными и неизменяемыми (строки, числа, кортежи).
</p>

<h2>Создание словарей</h2>
<pre><code># Литерал
person = {
    "name": "Анна",
    "age": 22,
    "city": "Москва"
}

# Через dict()
config = dict(host="localhost", port=8080)

# Пустой словарь
empty = {}
</code></pre>

<h2>Доступ и изменение</h2>
<pre><code>person = {"name": "Иван", "age": 25}

# Чтение
print(person["name"])            # Иван
print(person.get("email", "—"))  # — (если нет ключа)

# Добавление / изменение
person["email"] = "ivan@example.com"
person["age"] = 26

# Удаление
del person["city"]               # KeyError если нет ключа
removed = person.pop("age", 0)  # безопасное удаление
</code></pre>

<h2>Итерация по словарю</h2>
<pre><code>d = {"a": 1, "b": 2, "c": 3}

for key in d:
    print(key)

for key, value in d.items():
    print(f"{key} = {value}")

print(list(d.keys()))    # ['a', 'b', 'c']
print(list(d.values()))  # [1, 2, 3]
</code></pre>

<h2>Словарные выражения</h2>
<pre><code>words = ["яблоко", "банан", "вишня"]
lengths = {w: len(w) for w in words}
print(lengths)   # {'яблоко': 6, 'банан': 5, 'вишня': 6}
</code></pre>
""",

    "Множества": """
<h2>Что такое множество?</h2>
<p>
  <strong>Множество</strong> (<code>set</code>) — это неупорядоченная коллекция <em>уникальных</em> элементов.
  Дубликаты автоматически удаляются. Множества изменяемы, но их элементы должны быть неизменяемыми.
</p>

<h2>Создание множеств</h2>
<pre><code># Из литерала
fruits = {"яблоко", "банан", "вишня", "яблоко"}
print(fruits)   # {'яблоко', 'банан', 'вишня'}  — дубликат убран

# Из списка (удаляет дубликаты)
nums = set([1, 2, 2, 3, 3, 3])
print(nums)    # {1, 2, 3}

# Пустое множество (не {}!)
empty = set()
</code></pre>

<h2>Математические операции</h2>
<pre><code>A = {1, 2, 3, 4, 5}
B = {4, 5, 6, 7, 8}

print(A | B)   # объединение:    {1,2,3,4,5,6,7,8}
print(A &amp; B)   # пересечение:   {4, 5}
print(A - B)   # разность A\B:  {1, 2, 3}
print(A ^ B)   # симм. разность:{1,2,3,6,7,8}
</code></pre>

<h2>Проверка вхождения</h2>
<pre><code>primes = {2, 3, 5, 7, 11, 13}
print(7 in primes)    # True
print(6 in primes)    # False

# O(1) в отличие от O(n) у списка
</code></pre>

<h2>Практическое применение</h2>
<pre><code># Уникальные слова в тексте
text = "to be or not to be that is the question"
unique_words = set(text.split())
print(len(unique_words))  # 8

# Общие элементы двух списков
list1 = [1, 2, 3, 4, 5]
list2 = [3, 4, 5, 6, 7]
common = set(list1) &amp; set(list2)
print(common)   # {3, 4, 5}
</code></pre>
""",

    "Сортировка": """
<h2>Введение в алгоритмы сортировки</h2>
<p>
  <strong>Сортировка</strong> — упорядочивание элементов коллекции по заданному критерию.
  Эффективность алгоритма оценивается в терминах <em>Big-O нотации</em>.
</p>

<h2>Пузырьковая сортировка</h2>
<p>Простейший алгоритм: на каждом проходе «всплывает» наибольший элемент. Сложность: O(n²)</p>
<pre><code>def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] &gt; arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(data))   # [11, 12, 22, 25, 34, 64, 90]
</code></pre>

<h2>Быстрая сортировка (QuickSort)</h2>
<p>Делит массив на части относительно опорного элемента. Средняя сложность: O(n log n)</p>
<pre><code>def quick_sort(arr):
    if len(arr) &lt;= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x &lt; pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x &gt; pivot]
    return quick_sort(left) + mid + quick_sort(right)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
# [1, 1, 2, 3, 6, 8, 10]
</code></pre>

<h2>Сортировка слиянием (MergeSort)</h2>
<p>Делит массив пополам, сортирует части рекурсивно, затем сливает. Сложность: O(n log n)</p>
<pre><code>def merge_sort(arr):
    if len(arr) &lt;= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i &lt; len(left) and j &lt; len(right):
        if left[i] &lt;= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]
</code></pre>

<h2>Встроенная сортировка Python</h2>
<pre><code>lst = [3, 1, 4, 1, 5, 9, 2, 6]
sorted_lst = sorted(lst)          # новый список
lst.sort()                        # сортировка на месте

# Сортировка по ключу
words = ["banana", "apple", "cherry"]
words.sort(key=len)   # по длине слова
print(words)   # ['apple', 'banana', 'cherry']
</code></pre>
""",

    "Поиск": """
<h2>Введение в поиск</h2>
<p>
  Задача поиска — найти элемент в структуре данных или определить его отсутствие.
  Выбор алгоритма зависит от того, отсортированы ли данные.
</p>

<h2>Линейный поиск</h2>
<p>Перебирает все элементы по порядку. Работает на любой последовательности. Сложность: <strong>O(n)</strong></p>
<pre><code>def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1

data = [5, 3, 8, 1, 9, 2, 7]
print(linear_search(data, 9))   # 4
print(linear_search(data, 6))   # -1
</code></pre>

<h2>Бинарный поиск</h2>
<p>Работает только на <strong>отсортированном</strong> массиве. На каждом шаге отбрасывает половину данных. Сложность: <strong>O(log n)</strong></p>
<pre><code>def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left &lt;= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] &lt; target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

sorted_data = [1, 3, 5, 7, 9, 11, 13, 15]
print(binary_search(sorted_data, 7))   # 3
print(binary_search(sorted_data, 6))   # -1
</code></pre>

<h2>Сравнение алгоритмов</h2>
<ul>
  <li><strong>Линейный</strong>: прост, не требует сортировки, O(n)</li>
  <li><strong>Бинарный</strong>: очень быстр, требует сортировки, O(log n)</li>
</ul>
<blockquote>
  При n = 1 000 000 бинарный поиск делает не более 20 сравнений, линейный — до миллиона!
</blockquote>
""",

    "Основы SQL": """
<h2>Что такое SQL?</h2>
<p>
  <strong>SQL</strong> (Structured Query Language) — декларативный язык для работы с реляционными базами данных.
  Вы описываете <em>что</em> хотите получить, а СУБД сама выбирает способ.
</p>

<h2>SELECT — выборка данных</h2>
<pre><code>-- Все столбцы из таблицы
SELECT * FROM students;

-- Конкретные столбцы
SELECT name, age FROM students;

-- С условием
SELECT name, grade
FROM students
WHERE grade &gt;= 4;

-- Сортировка
SELECT name, grade
FROM students
ORDER BY grade DESC;

-- Ограничение количества строк
SELECT name FROM students LIMIT 10;
</code></pre>

<h2>INSERT — добавление данных</h2>
<pre><code>INSERT INTO students (name, age, grade)
VALUES ('Мария', 20, 5);

-- Несколько строк сразу
INSERT INTO students (name, age, grade) VALUES
  ('Иван', 21, 4),
  ('Анна', 19, 5),
  ('Пётр', 22, 3);
</code></pre>

<h2>UPDATE и DELETE</h2>
<pre><code>-- Обновить запись
UPDATE students
SET grade = 5
WHERE name = 'Иван';

-- Удалить запись
DELETE FROM students
WHERE grade &lt; 3;
</code></pre>

<h2>JOIN — объединение таблиц</h2>
<pre><code>-- INNER JOIN: только совпадающие строки
SELECT s.name, c.course_name
FROM students s
INNER JOIN enrollments e ON s.id = e.student_id
INNER JOIN courses c ON e.course_id = c.id;

-- LEFT JOIN: все из левой таблицы
SELECT s.name, c.course_name
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id
LEFT JOIN courses c ON e.course_id = c.id;
</code></pre>

<h2>Агрегатные функции</h2>
<pre><code>SELECT COUNT(*) AS total FROM students;
SELECT AVG(grade) AS avg_grade FROM students;
SELECT MAX(grade), MIN(grade) FROM students;

-- GROUP BY
SELECT grade, COUNT(*) AS count
FROM students
GROUP BY grade
HAVING COUNT(*) &gt; 2;
</code></pre>
""",

    "Реляционные базы данных": """
<h2>Реляционная модель данных</h2>
<p>
  В реляционных базах данных информация хранится в виде <strong>таблиц</strong> (relations).
  Строки таблицы — записи, столбцы — атрибуты. Таблицы связаны друг с другом через ключи.
</p>

<h2>Ключи</h2>
<ul>
  <li><strong>Первичный ключ (PK)</strong> — уникально идентифицирует каждую строку</li>
  <li><strong>Внешний ключ (FK)</strong> — ссылается на первичный ключ другой таблицы</li>
  <li><strong>Уникальный ключ</strong> — значение не повторяется, но может быть NULL</li>
</ul>

<h2>Создание таблиц</h2>
<pre><code>CREATE TABLE departments (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    salary     REAL CHECK(salary &gt; 0),
    dept_id    INTEGER REFERENCES departments(id)
                       ON DELETE SET NULL
);
</code></pre>

<h2>Нормализация</h2>
<p>Нормализация — процесс организации таблиц для уменьшения избыточности:</p>
<ul>
  <li><strong>1НФ</strong> — атомарные значения, нет повторяющихся групп</li>
  <li><strong>2НФ</strong> — нет частичной зависимости от составного ключа</li>
  <li><strong>3НФ</strong> — нет транзитивных зависимостей</li>
</ul>

<h2>Транзакции</h2>
<pre><code>BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- Если всё хорошо
COMMIT;

-- Если произошла ошибка
ROLLBACK;
</code></pre>

<blockquote>
  Транзакции обеспечивают свойства <strong>ACID</strong>: атомарность, согласованность, изолированность, устойчивость.
</blockquote>
""",

    "HTML и CSS": """
<h2>HTML — скелет веб-страницы</h2>
<p>
  <strong>HTML</strong> (HyperText Markup Language) описывает <em>структуру</em> содержимого.
  Браузер читает HTML и строит DOM — дерево объектов документа.
</p>

<h2>Базовая структура HTML</h2>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="ru"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
  &lt;title&gt;Моя страница&lt;/title&gt;
  &lt;link rel="stylesheet" href="styles.css"&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;header&gt;
    &lt;h1&gt;Заголовок сайта&lt;/h1&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;p&gt;Основное содержимое&lt;/p&gt;
  &lt;/main&gt;
  &lt;footer&gt;
    &lt;p&gt;&amp;copy; 2024&lt;/p&gt;
  &lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>

<h2>Семантические теги</h2>
<ul>
  <li><code>&lt;header&gt;</code> — шапка</li>
  <li><code>&lt;nav&gt;</code> — навигация</li>
  <li><code>&lt;main&gt;</code> — основной контент</li>
  <li><code>&lt;article&gt;</code> — независимый блок</li>
  <li><code>&lt;section&gt;</code> — секция</li>
  <li><code>&lt;footer&gt;</code> — подвал</li>
</ul>

<h2>CSS — оформление</h2>
<pre><code>/* Селекторы */
h1 { color: #2563eb; }             /* тег */
.card { border-radius: 8px; }      /* класс */
#hero { background: #f0f4ff; }     /* ID */

/* Flexbox */
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* Медиазапросы */
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</code></pre>

<h2>CSS-переменные</h2>
<pre><code>:root {
  --primary: #2563eb;
  --radius: 8px;
}

.btn {
  background: var(--primary);
  border-radius: var(--radius);
}
</code></pre>
""",

    "JavaScript": """
<h2>JavaScript — язык веба</h2>
<p>
  <strong>JavaScript</strong> — интерпретируемый язык с динамической типизацией.
  Позволяет добавлять <em>интерактивность</em> на страницы, работать с DOM, делать запросы к серверу.
</p>

<h2>Переменные и функции</h2>
<pre><code>// Объявление переменных
const PI = 3.14;      // константа
let count = 0;        // изменяемая

// Функция-декларация
function greet(name) {
  return `Привет, ${name}!`;
}

// Стрелочная функция
const double = x =&gt; x * 2;

console.log(greet("Алиса"));  // Привет, Алиса!
console.log(double(5));       // 10
</code></pre>

<h2>Работа с DOM</h2>
<pre><code>// Найти элемент
const btn = document.querySelector('#submit-btn');
const items = document.querySelectorAll('.item');

// Изменить содержимое
document.getElementById('title').textContent = 'Новый заголовок';

// Изменить стили
btn.style.backgroundColor = '#2563eb';

// Создать элемент
const li = document.createElement('li');
li.textContent = 'Новый элемент';
document.querySelector('ul').appendChild(li);
</code></pre>

<h2>Обработка событий</h2>
<pre><code>const btn = document.querySelector('#btn');

btn.addEventListener('click', (event) => {
  event.preventDefault();
  console.log('Кнопка нажата!');
});

// Делегирование событий
document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    e.target.classList.toggle('active');
  }
});
</code></pre>

<h2>Асинхронность: fetch + async/await</h2>
<pre><code>async function loadData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Использование
const users = await loadData('/api/users');
console.log(users);
</code></pre>
"""
}

def update_content():
    db = SessionLocal()
    try:
        topics = db.query(Topic).all()
        updated = 0
        for topic in topics:
            if topic.title in RICH_CONTENT:
                topic.content = RICH_CONTENT[topic.title]
                updated += 1
                print(f"Updated: {topic.title}")
            elif len(topic.content) < 50:
                # Give minimal topics at least some content
                topic.content = f"<h2>{topic.title}</h2><p>{topic.content}</p>"
                updated += 1
                print(f"Minimal update: {topic.title}")

        # Ensure all modules are published
        modules = db.query(Module).all()
        for m in modules:
            m.is_published = True

        db.commit()
        print(f"\nDone! Updated {updated} topics, published {len(modules)} modules.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_content()
