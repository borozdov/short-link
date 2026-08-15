# BOROZDOV LINK — tech.md

v1 — initial

## Changelog

- v1 — первая версия ядра.

## Проект

BOROZDOV LINK — сервис сокращения ссылок под личным доменом `link.borozdov.ru`. Любой URL превращается в `link.borozdov.ru/{uid}` с редиректом на исходный адрес.

Аудитория: Никита Бороздов и его читатели/подписчики, которым он рассылает короткие брендированные ссылки (посты, рассылки, документы). Цель — заменить сторонние сокращатели собственным инструментом с полным контролем над статистикой, сроком жизни ссылок и фирменным оформлением (ОБСИДИАН/ТИТАН).

Ключевые сценарии:

- Быстрое сокращение без регистрации: вставил URL — получил короткую ссылку, QR-код и приватную ссылку на статистику (по секретному токену, без логина).
- Регистрация опциональна и нужна только тем, кто хочет постоянный личный кабинет со списком всех своих ссылок и историей кликов. Анонимно созданную ссылку можно позже «забрать» в свой аккаунт по тому же секретному токену.
- Срок действия ссылки задаётся при создании; после истечения `link.borozdov.ru/{uid}` редиректит на `borozdov.ru` вместо ошибки.
- Массовое сокращение: вставил текст с кучей ссылок — получил тот же текст с заменёнными на короткие ссылками, остальной текст не тронут.
- Админ (Никита) видит всех пользователей, все ссылки (включая анонимные) и агрегаты по каждому.
- Дополнительные сценарии удобного использования: кастомный слаг, UTM-конструктор при создании, публичный API с ключом для программного сокращения, букмарклет «сократить текущую страницу».

Домен и хостинг готовы, внешних блокеров нет. Проект ведётся одной сессией последовательно (1 трек).

## Стек

Часть решений не задана во входных параметрах — выбраны и обоснованы ниже.

- **Backend**: Node.js + Express + TypeScript.
- **Frontend**: React + Vite + TypeScript, React Router.
- **БД**: PostgreSQL.
- **ORM/миграции**: Prisma — не задан во входе, выбран сам: типизированные запросы, миграции из коробки, стандарт для Node+Postgres.
- **Тест-раннер**: Vitest (+ Supertest для API) — не задан во входе, выбран сам: один раннер на весь монорепозиторий, быстрый, нативный ESM/TS.
- **Валидация входа**: Zod — схемы одновременно валидируют и порождают типы для `packages/shared`.
- **Auth**: JWT (access 15 мин + refresh 30 дней, httpOnly cookies), пароли — bcrypt — не задан во входе, выбран сам: без сервера сессий, естественно для отдельного API + SPA.
- **QR**: npm-пакет `qrcode` — не задан во входе, выбран сам: генерация PNG/SVG по запросу, без хранения файлов, минимум зависимостей.
- **Детект URL в тексте**: npm-пакет `linkify-it` — не задан во входе, выбран сам: устойчивее самодельного регэкспа на кириллице/пунктуации.
- **Фоновая работа**: `node-cron`, in-process, без внешней очереди — объём задач (2 джобы) не оправдывает отдельный воркер.
- **Хостинг/деплой**: домен и хостинг настроены пользователем заранее, процесс деплоя вне рамок `tech.md`.
- **CI**: нет (не задан во входе).
- **Трекер задач**: нет — задачи списком в разделе «Треки».

## Структура папок

Монорепозиторий, npm workspaces.

```
/
├── apps/
│   ├── api/                        # Express-бэкенд
│   │   ├── src/
│   │   │   ├── domains/
│   │   │   │   ├── links/          # создание, редирект, истечение, custom slug, utm, bulk-text, qr
│   │   │   │   ├── auth/           # регистрация, логин, refresh, jwt
│   │   │   │   ├── users/          # личный кабинет, claim ссылки
│   │   │   │   └── admin/          # админ-листинги и модерация
│   │   │   ├── jobs/                # expire-sweep.ts, daily-rollup.ts, scheduler.ts
│   │   │   ├── clients/             # интерфейсы внешних клиентов + фейки (email)
│   │   │   ├── db/                  # prisma client, seed.ts
│   │   │   ├── middleware/          # auth-guard, api-key-guard, error-handler, rate-limit
│   │   │   ├── config/              # env.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── test/
│   └── web/                        # React SPA
│       ├── src/
│       │   ├── primitives/          # Button, Input, Textarea, Select, Card, Table, Modal, Badge, Toast, Tabs, ThemeToggle, StatCard, CopyButton, QRPreview, EmptyState
│       │   ├── theme/               # design-токены, ObsidianTitanProvider
│       │   ├── routes/              # /, /login, /register, /dashboard, /admin, /s/:secretToken, /kitchen-sink
│       │   ├── features/
│       │   │   ├── shorten/         # форма создания + результат + QR
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── admin/
│       │   │   └── bulk-text/
│       │   ├── api/                 # типизированный fetch-клиент
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── test/
├── packages/
│   └── shared/                     # общие типы и zod-схемы
│       └── src/
│           ├── types/               # Link, User, Click, DailyLinkStat, Theme, ApiResponse
│           └── schemas/             # create-link, bulk-text, auth, claim-link
├── .env.example
└── package.json
```

## Схема данных

Prisma (`apps/api/prisma/schema.prisma`).

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  emailVerifiedAt DateTime?
  createdAt    DateTime @default(now())
  links        Link[]
  apiKeys      ApiKey[]
}

enum Role {
  USER
  ADMIN
}

model Link {
  id          String     @id @default(uuid())
  uid         String     @unique              // путь /{uid}
  targetUrl   String
  ownerId     String?
  owner       User?      @relation(fields: [ownerId], references: [id])
  isCustomSlug Boolean   @default(false)
  secretToken String     @unique               // доступ к статистике без логина
  status      LinkStatus @default(ACTIVE)
  expiresAt   DateTime?
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  clickCount  Int        @default(0)           // денормализовано, инкремент в транзакции клика
  createdAt   DateTime   @default(now())
  clicks      Click[]
  dailyStats  DailyLinkStat[]

  @@index([ownerId])
  @@index([status, expiresAt])
}

enum LinkStatus {
  ACTIVE
  EXPIRED
  DISABLED
}

model Click {
  id         String   @id @default(uuid())
  linkId     String
  link       Link     @relation(fields: [linkId], references: [id])
  occurredAt DateTime @default(now())
  referrer   String?
  userAgent  String?
  ipHash     String?               // sha256(ip + соль из env), сырой ip не хранится
  country    String?

  @@index([linkId, occurredAt])
}

model DailyLinkStat {
  linkId     String
  link       Link     @relation(fields: [linkId], references: [id])
  date       DateTime  // усечено до суток, UTC 00:00
  clickCount Int      @default(0)

  @@id([linkId, date])
}

model ApiKey {
  id        String    @id @default(uuid())
  keyHash   String    @unique   // хранится хеш, не сырой ключ
  ownerId   String
  owner     User      @relation(fields: [ownerId], references: [id])
  createdAt DateTime  @default(now())
  revokedAt DateTime?
}
```

Правила генерации `uid`: base62, 7 символов, `nanoid`; при коллизии unique-констрейнта — до 5 повторных генераций, дальше 500.

Правила `customSlug` (когда пользователь задаёт свой `uid`): regex `^[a-zA-Z0-9_-]{3,32}$`, запрещённые значения (совпадают с роутами SPA и API-префиксами): `admin`, `api`, `login`, `register`, `dashboard`, `kitchen-sink`, `s`, `stats`, `qr`.

## Контракты фоновой работы и событий

**expire-sweep** (`apps/api/src/jobs/expire-sweep.ts`, `node-cron`, раз в час, без payload):
`UPDATE "Link" SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND "expiresAt" < now()`.
Идемпотентно по конструкции — условие `WHERE` делает повторный запуск на том же состоянии БД no-op.

**daily-rollup** (`apps/api/src/jobs/daily-rollup.ts`, `node-cron`, ежедневно 00:10 UTC):
Payload: `{ date: string }` (ISO-дата суток, по умолчанию — вчера по UTC).
Логика: агрегирует `Click` за `date` по `linkId`, пишет в `DailyLinkStat` через `upsert` на составном ключе `(linkId, date)`.
Идемпотентно: повторный запуск с тем же `date` пересчитывает и перезаписывает `clickCount`, не прибавляет к нему.

**Запись клика** (не джоба — синхронный обработчик в редиректе, `apps/api/src/domains/links/redirect.ts`):
На каждый `GET /:uid` с активной ссылкой: в одной транзакции — `INSERT INTO "Click"` и `UPDATE "Link" SET "clickCount" = "clickCount" + 1`. Не идемпотентно и не должно быть: каждый HTTP-запрос — реальное событие клика. Известное ограничение: префетч браузера/антивируса может завысить счётчик; не компенсируется в MVP.

**Fallback-редирект**: `uid` не найден, либо `status != ACTIVE` → `302` на `BASE_FALLBACK_URL` (env, по умолчанию `https://borozdov.ru`). Клик в этом случае не пишется.

**UTM на редиректе**: конечный URL = `targetUrl` с домерженными `utm_source`/`utm_medium`/`utm_campaign` (если заданы на ссылке) поверх существующих query-параметров таргета через `URL`/`URLSearchParams`.

## Общие типы

Путь: `packages/shared/src/`.

- `types/Link.ts` — `Link` (поля модели без `secretToken`/`ipHash`-деталей клиента, публичная проекция), `LinkStatus`.
- `types/User.ts` — `User` (без `passwordHash`), `Role`.
- `types/Click.ts` — `Click`, `DailyLinkStat`.
- `types/ApiResponse.ts` — `ApiResponse<T> = { data: T } | { error: { code: string; message: string } }`. Оборачивает ответ каждого эндпоинта без исключений (используется в каждой задаче трека).
- `types/Theme.ts` — `Theme = 'obsidian' | 'titan'`. Используется `ThemeProvider`/`ThemeToggle` в общем layout (раздел «Скелет», п.4) — на нём рендерятся страницы всех задач.
- `schemas/create-link.ts` — Zod: `CreateLinkRequest { targetUrl: string; customSlug?: string; expiresInHours?: number; utm?: { source?: string; medium?: string; campaign?: string } }`, `CreateLinkResponse { shortUrl: string; uid: string; secretToken: string; qrUrl: string }`.
- `schemas/bulk-text.ts` — Zod: `BulkTextRequest { text: string }` (лимит 50 000 символов, максимум 200 ссылок за запрос), `BulkTextResponse { text: string; created: Array<{ original: string; short: string }> }`.
- `schemas/auth.ts` — `RegisterRequest { email: string; password: string }`, `LoginRequest { email: string; password: string }`.
- `schemas/claim-link.ts` — `ClaimLinkRequest { secretToken: string }`.

## UI-примитивы

Путь: `apps/web/src/primitives/`. База — сами примитивы (сторонней UI-библиотеки нет), стилизация по BOROZDOV design system (роли цвета через CSS-переменные, обе темы, инверсия как единственный акцент, заглавные лейблы, моноширинные числа).

- **Button** — `variant: 'default' | 'inverted'`, `size`, `disabled`, `loading`.
- **Input** / **Textarea** — `label`, `error`, `monospace?` (для полей с числовым/техническим вводом).
- **Select** — `options`, `value`, `onChange`.
- **Card** — контейнер-поверхность, `padding`.
- **Table** — `columns`, `rows`, числовые колонки рендерятся моноширинным шрифтом.
- **Modal** — `open`, `onClose`, дымка за окном (единственная тень в системе).
- **Badge** — статус-метка (`active` / `expired` / `disabled`), заглавными, инверсия для акцента.
- **Toast** — уведомления (скопировано, ошибка).
- **Tabs** — переключение разделов личного кабинета/админки.
- **ThemeToggle** — переключатель ОБСИДИАН/ТИТАН, мгновенный, без каскадного перехода.
- **StatCard** — карточка метрики, число — моноширинным с `tabular-nums`.
- **CopyButton** — копирует короткую ссылку в буфer, короткая анимация.
- **QRPreview** — превью QR с кнопкой скачивания PNG/SVG.
- **EmptyState** — пустой список ссылок/кликов.

## Владение инфраструктурой

За владельцем ядра (единственный трек, но правки — отдельным коммитом с явным описанием):

- Миграции: `apps/api/prisma/migrations/*`, генерируются из `schema.prisma`, применяются шагом деплоя (`prisma migrate deploy`).
- Сид-скрипт: `apps/api/src/db/seed.ts` — один демо-админ, несколько демо-ссылок (активная, с кастомным слагом, истёкшая) с демо-кликами для фейковых данных дашборда/kitchen-sink.
- Конфиг: `apps/api/src/config/env.ts` и `apps/web/src/config/env.ts`, единая точка чтения переменных окружения.
- `.env.example` в корне — все переменные, без реальных секретов: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BASE_LINK_DOMAIN`, `BASE_FALLBACK_URL`, `IP_HASH_SALT`, `SMTP_*` (опционально, фейк по умолчанию).

## Конвенции кода

- Язык коммитов, PR и комментариев — английский.
- Формат коммита — Conventional Commits: `type(scope): summary`. `type` из набора `feat|fix|test|refactor|chore|docs`. `summary` в императиве, со строчной, без точки, до ~50 символов. Тело коммита — только *почему*, не *что*.
- Коммитить по ходу работы, маленькими логическими коммитами после каждого осмысленного шага, не одним коммитом в конце. Каждый коммит по возможности проходит тайпчек.
- PR: краткий заголовок; тело — что делает слайс, какие контракты затрагивает, чем покрыт тестами.
- Комментарии в коде объясняют *почему*, не пересказывают очевидный код. Закомментированный код в PR не оставлять.
- Проза (README, PR-описания) — активный залог, императив, без филлеров, без em-dash.
- TypeScript strict mode везде. Функциональные React-компоненты, без классов.
- Валидация любого внешнего входа (API body, query) — через Zod-схемы из `packages/shared`, до попадания в доменную логику.
- Ошибки API — единый формат через `ApiResponse`, централизованный error-middleware, никаких голых `throw` до клиента.
- Секреты (`secretToken`, `passwordHash`, сырые API-ключи) никогда не логируются и не попадают в публичные типы `Link`/`User`.

## Тесты

Обязательные типы (проект M — все обязательные типы, версионирование ядра обязательно):

- **Контрактные на стыках.** Redirect-обработчик проверяется против схемы `Link`/`Click` из `tech.md`: активная ссылка → 302 на `targetUrl` (+ UTM) и запись `Click`; неактивная/отсутствующая → 302 на `BASE_FALLBACK_URL`, `Click` не пишется. Bulk-text парсер проверяется против контракта `BulkTextResponse`: найденные URL заменены, весь остальной текст побайтово идентичен исходному, ссылки на собственный домен не сокращаются повторно.
- **Идемпотентность обработчиков.** `expire-sweep` и `daily-rollup` — тест гоняет джобу дважды с одним и тем же состоянием БД/payload, проверяет, что результат идентичен после первого и второго прогона (не задваивается).
- **Путь ошибки.** Истёкшая ссылка, отключённая (`DISABLED`) ссылка, несуществующий `uid` — все три ведут на fallback, не на 500/404 в отдаваемой странице. Невалидный `targetUrl` при создании — 400 с понятной ошибкой, запись в БД не создаётся.
- **Property-based на чистой логике.** Извлечение URL из свободного текста (`fast-check` + `linkify-it`): генерируются строки со смесью URL и произвольного текста, проверяется инвариант — не-URL-подстроки не меняются, каждый найденный URL заменён ровно один раз.

## Definition of Done

- `eslint` чист по всему workspace.
- `tsc --noEmit` чист по всему workspace (`apps/api`, `apps/web`, `packages/shared`).
- `vitest run` зелёный, включая обязательные типы тестов из раздела «Тесты».
- `vite build` (web) и `tsc build` (api) проходят без ошибок.
- Миграции применяются на чистой БД (`prisma migrate deploy` на пустой Postgres).
- PR-чеклист заполнен: какие контракты затронуты, чем покрыто тестами.

## Скелет

Порядок сборки владельцем, до начала треков:

1. Монорепо (npm workspaces), `apps/api`, `apps/web`, `packages/shared`, базовый `package.json`/`tsconfig`.
2. `schema.prisma` целиком (раздел «Схема данных»), первая миграция, `seed.ts`.
3. Конфиг-модуль и `.env.example`.
4. UI-примитивы + тема (CSS-переменные ОБСИДИАН/ТИТАН, `ThemeProvider`, `ThemeToggle`), роут `/kitchen-sink` со всеми примитивами.
5. Каркас Express (`app.ts`, error-middleware, auth-guard-заглушка) и каркас React (роутинг, layout, шапка с `ThemeToggle`).
6. Фейк `EmailSender` (интерфейс + консольная реализация) в `clients/`.
7. `scheduler.ts` с демо-джобой (лог в консоль по `node-cron`), подключение `expire-sweep`/`daily-rollup` как заглушек.
8. Эталонная сквозная вертикаль: анонимное создание ссылки → редирект → запись клика (домен `links`, минимальный набор полей, без custom slug/UTM/QR — это отдельные задачи трека).

Чек-лист «скелет готов»:

- [ ] `apps/api` и `apps/web` в main, оба стартуют локально одной командой из корня.
- [ ] `ThemeToggle` переключает ОБСИДИАН/ТИТАН мгновенно, выбор сохраняется (localStorage), при первом визите — из `prefers-color-scheme`.
- [ ] Все UI-примитивы из раздела «UI-примитивы» отрендерены на `/kitchen-sink`.
- [ ] `node-cron` гоняет демо-джобу, видно в логах.
- [ ] Фейковый `EmailSender` пишет письма в консоль вместо реальной отправки.
- [ ] Миграции применяются на чистой БД, `seed.ts` наполняет демо-данными.
- [ ] Эталонная вертикаль (анонимное создание ссылки → редирект → клик) работает end-to-end в main.
- [ ] `.env.example` покрывает все переменные, приложение стартует без реальных секретов.

## Треки

Один трек — Track A, полное владение `apps/api`, `apps/web`, `packages/shared`. Задачи выполняются последовательно, каждая — отдельный вертикальный слайс и отдельный PR. Эталонный слайс для структуры — п.8 «Скелета» (анонимное создание ссылки → редирект → клик).

Что не трогать вне отдельного явного коммита: `apps/api/prisma/migrations/*`, схему в `prisma/schema.prisma`, `packages/shared` — правки контрактов и общих типов только через append в разделы «Схема данных»/«Общие типы» этого файла с бампом версии в «Changelog».

### Задача 1 — Создание ссылки: custom slug, срок действия, QR

Цель: полноценное создание ссылки поверх эталонной вертикали — кастомный слаг, срок действия, QR.
Контракты/типы: `CreateLinkRequest`/`CreateLinkResponse`, правила генерации `uid` и валидации `customSlug` (раздел «Схема данных»).
Примитивы: Card (контейнер формы и результата), Input, Textarea, Select, Button, QRPreview, CopyButton, Toast.
Критерии приёмки: анонимный пользователь создаёт ссылку без логина; можно задать свой слаг (конфликт/запрещённое слово → понятная ошибка); можно задать срок действия (без срока — бессрочно); ответ содержит короткую ссылку, QR (PNG/SVG) и ссылку на статистику по `secretToken`.
Тесты: контрактный на `CreateLinkResponse`, валидация `customSlug` (запрещённые слова, формат), ошибка на невалидный `targetUrl`.

### Задача 2 — Истечение и fallback-редирект

Цель: `expire-sweep`, fallback на `borozdov.ru`, страница статистики по `secretToken`.
Контракты/типы: контракт `expire-sweep` и «Fallback-редирект» (раздел «Контракты фоновой работы и событий»).
Примитивы: Badge (статус ссылки), StatCard, Table.
Критерии приёмки: истёкшая/отключённая/несуществующая ссылка редиректит на `BASE_FALLBACK_URL`; `expire-sweep` переводит `ACTIVE` в `EXPIRED` по расписанию; страница `/s/:secretToken` показывает счётчик кликов и таймлайн без логина.
Тесты: путь ошибки (три случая fallback), идемпотентность `expire-sweep`.

### Задача 3 — Аутентификация

Цель: регистрация, логин, JWT (access+refresh), роли `USER`/`ADMIN`.
Контракты/типы: `RegisterRequest`/`LoginRequest`, `User` (публичная проекция), фейк `EmailSender` (верификационное письмо, не блокирует логин в MVP).
Примитивы: Input, Button, Toast.
Критерии приёмки: регистрация с email+паролем; логин выдаёт httpOnly access/refresh cookies; защищённые роуты отклоняют запрос без валидного access-токена; refresh продлевает сессию.
Тесты: контрактный на форму `RegisterRequest`/`LoginRequest`, путь ошибки (неверный пароль, занятый email).

### Задача 4 — Личный кабинет и claim ссылки

Цель: список своих ссылок, статистика по каждой, привязка анонимной ссылки по `secretToken`.
Контракты/типы: `ClaimLinkRequest`, `DailyLinkStat`.
Примитивы: Table, Tabs, StatCard, EmptyState, Modal (подтверждение удаления).
Критерии приёмки: авторизованный пользователь видит только свои ссылки (`ownerId` = текущий пользователь); может ввести `secretToken` чужой/своей анонимной ссылки и забрать её себе (`ownerId` проставляется, повторный claim той же ссылки другим пользователем — ошибка); графики кликов используют `DailyLinkStat`.
Тесты: контрактный на изоляцию по `ownerId` (пользователь A не видит ссылки пользователя B), путь ошибки повторного claim.

### Задача 5 — Админ-панель

Цель: список всех пользователей и всех ссылок (включая анонимные), агрегаты по пользователю, модерация.
Контракты/типы: `Link`, `User`, `daily-rollup`-агрегаты.
Примитивы: Table, Tabs, StatCard, Badge, Modal.
Критерии приёмки: доступ только роли `ADMIN`; список пользователей с количеством ссылок и суммой кликов на пользователя; список всех ссылок с фильтром по статусу/владельцу; возможность перевести ссылку в `DISABLED`.
Тесты: контрактный на доступ (не-админ получает 403), путь ошибки (модерация несуществующей ссылки).

### Задача 6 — Массовое сокращение ссылок в тексте

Цель: вставка большого текста, замена всех найденных URL на короткие ссылки, остальной текст не тронут.
Контракты/типы: `BulkTextRequest`/`BulkTextResponse`, лимиты (50 000 символов, 200 ссылок), правило пропуска URL на собственном домене.
Примитивы: Textarea, Button, CopyButton, Toast.
Критерии приёмки: смешанный текст (URL + обычный текст) на выходе — тот же текст с заменёнными ссылками; ссылки на `link.borozdov.ru` не сокращаются повторно; превышение лимита — понятная ошибка, ничего не создаётся частично.
Тесты: property-based на извлечение URL, контрактный на `BulkTextResponse`, путь ошибки (превышение лимита).

### Задача 7 — Доп. сценарии: UTM, публичный API, букмарклет

Цель: UTM-конструктор при создании ссылки, публичный API с ключом, букмарклет.
Контракты/типы: `utmSource`/`utmMedium`/`utmCampaign` на `Link` (уже в схеме), `ApiKey`, контракт «UTM на редиректе».
Примитивы: Input, Badge, CopyButton.
Критерии приёмки: при создании можно задать UTM-метки, они домерживаются в целевой URL при редиректе; авторизованный пользователь генерирует API-ключ в личном кабинете (показывается один раз, хранится хеш); `POST /api/links` принимает `Authorization: Bearer <key>` как альтернативу cookie-сессии, рейт-лимит на ключ; страница с текстом букмарклета и инструкцией — открывает `link.borozdov.ru` с текущим URL вкладки, создаёт анонимную ссылку и показывает результат.
Тесты: контрактный на UTM-merge при редиректе, путь ошибки (невалидный/отозванный API-ключ — 401).

## Очередь контрактов

Пусто на старте. Формат записи при `CONTRACT GAP`:

```
- Что нужно:
  Зачем:
  Предлагаемая форма:
  Временная заглушка:
  Статус: open | closed (vX)
```
