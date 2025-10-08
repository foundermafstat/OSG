# QR Party - Next.js Client

Клиентская часть игры QR Party, построенная на Next.js 15.

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка IP адреса

⚠️ **Важно!** Перед запуском обновите `env.config.ts` с вашим локальным IP адресом.

Откройте файл `env.config.ts` и измените `LOCAL_IP` на ваш текущий IP:

```typescript
export const ENV_CONFIG = {
	LOCAL_IP: '192.168.1.43', // Замените на ваш IP
	CLIENT_PORT: 3000,
	SERVER_PORT: 3001,
};
```

**Как узнать свой IP:**

- Windows: `ipconfig` в cmd
- macOS/Linux: `ifconfig` в терминале

### 3. Запуск приложения

**Development режим:**

```bash
npm run dev
```

Приложение запустится на `http://localhost:3000`

**Production сборка:**

```bash
npm run build
npm start
```

## Запуск полного проекта

Для полноценной работы игры нужны сервер и клиент:

**Терминал 1 - Сервер (из корня проекта):**

```bash
cd ..
node server/server.js
```

**Терминал 2 - Клиент:**

```bash
npm run dev
```

## Структура проекта

```
client/
├── app/
│   ├── layout.tsx        # Главный layout
│   ├── page.tsx          # Домашняя страница
│   └── globals.css       # Глобальные стили
├── components/
│   ├── GameScreen.tsx    # Экран игры с PixiJS
│   ├── MobileController.tsx  # Мобильный контроллер
│   └── QRCodeDisplay.tsx # Компонент QR кода
├── env.config.ts         # Конфигурация окружения
└── package.json
```

## Технологии

- **Next.js 15** - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Socket.IO Client** - WebSocket соединение
- **PixiJS** - Графический движок
- **QRCode** - Генерация QR кодов
- **Lucide React** - Иконки

## Использование

1. Откройте `http://localhost:3000` в браузере
2. Нажмите "Start Game Screen"
3. Нажмите кнопку "Connect" для отображения QR кода
4. Отсканируйте QR код с мобильного устройства
5. Введите имя и начните играть!

## Особенности Next.js версии

- ✅ Server Components для оптимизации
- ✅ Использование App Router
- ✅ Автоматическая оптимизация изображений
- ✅ Встроенная поддержка TypeScript
- ✅ Fast Refresh для быстрой разработки

## Отличия от Vite версии

### Порт по умолчанию

- **Vite**: 5173
- **Next.js**: 3000

### Структура файлов

- **Vite**: `src/` директория
- **Next.js**: `app/` директория (App Router)

### Конфигурация

- **Vite**: `vite.config.ts`
- **Next.js**: `next.config.ts`

## Устранение неполадок

### Ошибка подключения к серверу

Убедитесь что:

1. Сервер запущен на порту 3001
2. IP адрес в `env.config.ts` правильный
3. Все устройства в одной сети

### Canvas/PixiJS ошибки

В Next.js PixiJS может требовать клиентский рендеринг. Убедитесь, что компоненты помечены `'use client'`.

### Ошибки импорта

Используйте алиас `@/` для импорта из корня проекта:

```typescript
import Component from '@/components/Component';
```

## Разработка

### Добавление новых страниц

Создайте файл в директории `app/`:

```
app/new-page/page.tsx
```

### Добавление API роутов

Создайте файл `route.ts` в `app/api/`:

```
app/api/my-route/route.ts
```

## Команды

```bash
npm run dev          # Запуск dev сервера
npm run build        # Создание production сборки
npm start            # Запуск production сервера
npm run lint         # Проверка кода
```

## Лицензия

MIT
