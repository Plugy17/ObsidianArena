# Obsidian Arena

Фэнтезийная MOBA-арена с блокчейн-экономикой на базе TON.

Telegram Mini App игра с элементами Web3, включающая авторизацию через TON Connect, инвентарь, экономику Obsidian (OBS) и GRAM, гильдии и торговую площадку.

## Технологический стек

- **Framework:** Vite + React 19 (TypeScript)
- **Стили:** Tailwind CSS v4
- **Анимации:** Framer Motion
- **Web3:** @tonconnect/ui-react
- **Telegram:** @telegram-apps/sdk-react
- **Иконки:** lucide-react

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка

```bash
npm run build
```

Сборка будет помещена в папку `dist/`

## Структура проекта

```
src/
├── components/
│   ├── ui/          # UI компоненты (Button, Modal, Card)
│   ├── layout/      # Layout компоненты (Header, BottomNavigation)
│   └── game/        # Игровые компоненты (CharacterCard, InventoryGrid, MarketExchange, GuildList)
├── pages/           # Страницы (Dashboard, Arena, Inventory, Market, Guilds)
├── context/         # Контекст-провайдеры (TonProvider, TelegramProvider, UserContext)
├── config/          # Конфигурация (constants, tonconnect-manifest)
├── services/        # Сервисы (firebase, web3)
├── types/           # TypeScript типы
├── App.tsx          # Главный компонент
└── main.tsx         # Точка входа
```

## Архитектура

### TON Connect
- `tonconnect-manifest.json` в папке `public/`
- `TonProvider` оборачивает приложение в `TonConnectUIProvider`
- Поддержка подключения/отключения кошелька TON

### Telegram Web Apps
- `TelegramProvider` инициализирует Telegram SDK
- Использует `window.Telegram.WebApp` для доступа к API Telegram
- Поддержка expand, haptic feedback, main button, back button

### Игровая логика
- `UserContext` управляет состоянием пользователя, персонажей, инвентаря, гильдий
- Mock-данные для разработки (заменяются на Firebase в продакшене)
- Система авторизации через Telegram + TON Connect

## Лицензия

MIT
