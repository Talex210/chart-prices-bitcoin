# Bitcoin Price Tracker
Тестовое задание для позиции Full Stack Developer
## Стек технологий
- Nuxt 3
- Vue 3
- Node.js
- PostgreSQL
- Docker
- D3.js
## Функционал
- [x] График цен BTC с использованием D3.js
- [x] Выбор периода (день, неделя, месяц, год)
- [x] Кастомный диапазон дат
- [x] Docker-контейнеризация
- [x] 3 источника данных: CoinGecko, AlphaVantage, CoinDesk
- [x] Автоматическое обновление данных каждый час
- [x] Бэкфилл исторических данных с 2020 года
- [x] Адаптивный дизайн
- [x] Интерактивные элементы графика
## Быстрый запуск через Docker Compose
1. Клонировать репозиторий:
```bash
git clone https://github.com/Talex210/chart-prices-bitcoin.git
cd chart-prices-bitcoin
```
2. Создать файл `.env` в корне проекта (пример):
```env
# PostgresSQL
DB_USER=postgres
DB_PASSWORD=ваш_пароль_здесь
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_tracker

# API_KEYS
COINGECKO_API_KEY=ваш_ключ_здесь
ALPHAVANTAGE_API_KEY=ваш_ключ_здесь
COINDESK_API_KEY=ваш_ключ_здесь
```
3. Запустить приложение:
```bash
docker-compose up --build -d
```
4. Приложение будет доступно по адресу:  
   http://localhost:3005
5. Если автоматический запуск не сработал и мы видим данные за последние сутки, то выполнить команду:
```bash
docker-compose exec app curl -X POST http://localhost:3000/api/backFill
```
## Ручная установка (без Docker)
1. Установить зависимости:
```bash
npm install
```
2. Установите и запустите PostgreSQL (требуется версия 15+). Создайте базу данных и пользователя:
```sql
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE bitcoin_tracker;
GRANT ALL PRIVILEGES ON DATABASE bitcoin_tracker TO postgres;
```
3. Создать файл `.env` в корне проекта:
```env
# PostgresSQL
DB_USER=postgres
DB_PASSWORD=ваш_пароль_здесь
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_tracker

# API_KEYS
COINGECKO_API_KEY=ваш_ключ_здесь
ALPHAVANTAGE_API_KEY=ваш_ключ_здесь
COINDESK_API_KEY=ваш_ключ_здесь
```
4. Запустить приложение:
```bash
npm run dev
```
## Особенности реализации
### Архитектура проекта
```
├── docker-compose.yml
├── server/
│   ├── api/               # API эндпоинты
│   ├── database/          # Работа с PostgreSQL
│   ├── services/          # Сервисы для API бирж
│   └── cron/              # Фоновые задачи
└── components/            # Vue-компоненты
    └── LineChart.vue      # График на D3.js
```
### Ключевые эндпоинты
- `GET /api/pricesFromBD` - получение данных для графика
    - Параметры:
        - `period` (day/week/month/year)
        - `source` (coingecko/alphavantage/coindesk)
        - `startTime` & `endTime` (timestamp) для кастомного периода
- `POST /api/backFill` - заполнение исторических данных (автоматически запускается при старте)
- Если автоматический запуск не произашел то можно запустить командой для Windows:
```bash
curl -Method POST http://localhost:3001/api/backFill
```
- команда для Linux:
```bash
curl -X POST http://localhost:3001/api/backFill
```
### Источники данных
1. **CoinGecko API** - основной источник (обязателен)
    - Получить ключ: https://www.coingecko.com/en/api
2. AlphaVantage API (опционально)
3. CoinDesk API (опционально)
### Особенности работы
- **При первом запуске** автоматически заполняются исторические данные BTC/USD с 2020 года (может занять 2-5 минут)
- **Данные обновляются каждый час** для всех источников
- **Адаптивная выборка данных**:
    - День: почасовые данные
    - Неделя: данные каждые 6 часов
    - Месяц/Год: дневные данные
- **График**:
    - Плавные анимации при изменении данных
    - Интерактивные подсказки при наведении
    - Автоматическое масштабирование
- **Интерфейс**:
    - Выбор источника данных
    - Выбор периода
    - Календарь для выбора произвольного диапазона
## Решение поставленной задачи
### Выполненные требования
- **Nuxt.js приложение** (frontend + backend)
- **Выбор периода**: день, неделя, месяц, год + кастомный диапазон
- **График цен** с использованием D3.js
- **Сбор данных** с бирж через API
- **Хранение данных** в PostgreSQL
- **Docker Compose** для запуска всей системы
- **Автоматическое обновление** данных
### Как устроена система
1. **Инициализация**:
    - Создание таблиц в БД
    - Заполнение исторических данных (с 2020 года)
    - Проверка данных за последние 24 часа
2. **Фоновые задачи** (cron):
    - Каждый час: запрос актуальных цен из API и сохранение в БД
    - Автоматический бэкфилл при недостатке данных
3. **API**:
    - Предоставляет данные для графика
    - Адаптивная выборка в зависимости от периода
    - Фильтрация по источнику
4. **Фронтенд**:
    - Динамический график с D3.js
    - Управление периодом и источником
    - Кастомный выбор дат
## Технические примечания
- **Обязателен API ключ CoinGecko** для работы приложения
- При запуске через Docker:
    - Данные БД сохраняются в volume `postgres_data`
    - Для полного сброса данных: `docker-compose down -v`
- При работе без Docker убедитесь, что PostgreSQL запущен
- Первоначальное заполнение данных может занять время (зависит от диапазона)
  Для связи: [Telegram](https://t.me/alexYabandji)
