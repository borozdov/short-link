# BOROZDOV LINK — tech.md

v8 — превью коротких ссылок для ботов соцсетей на редиректе

## Changelog

- v1 — первая версия ядра.
- v2 — добавлены `types/Link.ts`, `types/Click.ts`, `schemas/link-stats.ts` (контракт `GET /api/links/stats/:secretToken` для Задачи 2).
- v3 — добавлены `types/User.ts`, `schemas/auth.ts` (контракты `RegisterRequest`/`LoginRequest` для Задачи 3).
- v4 — добавлены `types/DailyLinkStat.ts`, `schemas/claim-link.ts`, эндпоинты `/api/users/links*` (личный кабинет и claim для Задачи 4).
- v5 — добавлены `types/ApiKey.ts`, `schemas/api-key.ts`, эндпоинты `/api/users/api-keys*`, `Authorization: Bearer` на `POST /api/links`, рейт-лимит на API-ключ (для Задачи 7).
- v6 — убрана возможность задать свой слаг: поле `customSlug` из `CreateLinkRequest`, поле `isCustomSlug` из модели `Link`/типа `Link` (миграция `remove_custom_slug`), коды ошибок `INVALID_CUSTOM_SLUG`/`SLUG_TAKEN`. `uid` теперь всегда генерируется сервером.
- v7 — убраны аккаунты целиком: логин, регистрация, личный кабинет, claim ссылки, админ-панель, API-ключи. Убраны `model User`/`enum Role`/`model ApiKey`, поле `Link.ownerId`, эндпоинты `/api/auth/*`, `/api/users/*`, `Authorization: Bearer` на `POST /api/links` (миграция `remove_accounts`). Статистика по ссылке остаётся доступной только через `secretToken` (приватная ссылка/QR), без какого-либо понятия владельца.
- v8 — превью коротких ссылок для ботов соцсетей/мессенджеров на `GET /:uid` (`domains/links/bot-preview.ts`): зеркалирование `og:title`/`og:description`/`og:image` целевой страницы вместо редиректа, SSRF-защищённый server-side fetch, in-memory кэш. Схема/миграции не тронуты — новых полей нет. См. «Bot-preview на редиректе» в разделе «Контракты фоновой работы и событий».

## Проект

BOROZDOV LINK — сервис сокращения ссылок под личным доменом `link.borozdov.ru`. Любой URL превращается в `link.borozdov.ru/{uid}` с редиректом на исходный адрес.

Аудитория: Никита Бороздов и его читатели/подписчики, которым он рассылает короткие брендированные ссылки (посты, рассылки, документы). Цель — заменить сторонние сокращатели собственным инструментом с полным контролем над статистикой, сроком жизни ссылок и фирменным оформлением (ОБСИДИАН/ТИТАН).

Ключевые сценарии:

- Быстрое сокращение без регистрации: вставил URL — получил короткую ссылку, QR-код и приватную ссылку на статистику (по секретному токену). Аккаунтов в продукте нет вообще — статистика по ссылке доступна только тому, у кого есть QR-код или сама секретная ссылка.
- Срок действия ссылки задаётся при создании; после истечения `link.borozdov.ru/{uid}` редиректит на `borozdov.ru` вместо ошибки.
- Массовое сокращение: вставил текст с кучей ссылок — получил тот же текст с заменёнными на короткие ссылками, остальной текст не тронут.
- Дополнительный сценарий удобного использования: UTM-конструктор при создании.

Домен и хостинг готовы, внешних блокеров нет. Проект ведётся одной сессией последовательно (1 трек).

## Стек

Часть решений не задана во входных параметрах — выбраны и обоснованы ниже.

- **Backend**: Node.js + Express + TypeScript.
- **Frontend**: React + Vite + TypeScript, React Router.
- **БД**: PostgreSQL.
- **ORM/миграции**: Prisma — не задан во входе, выбран сам: типизированные запросы, миграции из коробки, стандарт для Node+Postgres.
- **Тест-раннер**: Vitest (+ Supertest для API) — не задан во входе, выбран сам: один раннер на весь монорепозиторий, быстрый, нативный ESM/TS.
- **Валидация входа**: Zod — схемы одновременно валидируют и порождают типы для `packages/shared`.
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
│   │   │   │   └── links/          # создание, редирект, истечение, utm, bulk-text, qr, статистика
│   │   │   ├── jobs/                # expire-sweep.ts, daily-rollup.ts, scheduler.ts
│   │   │   ├── db/                  # prisma client, seed.ts
│   │   │   ├── middleware/          # error-handler, rate-limit
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
│       │   ├── routes/              # /, /s/:secretToken, /bulk-text, /kitchen-sink
│       │   ├── features/
│       │   │   ├── shorten/         # форма создания + результат + QR
│       │   │   └── bulk-text/
│       │   ├── api/                 # типизированный fetch-клиент
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── test/
├── packages/
│   └── shared/                     # общие типы и zod-схемы
│       └── src/
│           ├── types/               # Link, Click, DailyLinkStat, Theme, ApiResponse
│           └── schemas/             # create-link, bulk-text, link-stats
├── .env.example
└── package.json
```

## Схема данных

Prisma (`apps/api/prisma/schema.prisma`).

```prisma
model Link {
  id          String     @id @default(uuid())
  uid         String     @unique              // путь /{uid}
  targetUrl   String
  secretToken String     @unique               // доступ к статистике, без аккаунта
  status      LinkStatus @default(ACTIVE)
  expiresAt   DateTime?
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  clickCount  Int        @default(0)           // денормализовано, инкремент в транзакции клика
  createdAt   DateTime   @default(now())
  clicks      Click[]
  dailyStats  DailyLinkStat[]

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
```

Правила генерации `uid`: base62, 7 символов, `nanoid`; при коллизии unique-констрейнта — до 5 повторных генераций, дальше 500. Свой `uid` пользователь задать не может — только серверная генерация.

## Контракты фоновой работы и событий

**expire-sweep** (`apps/api/src/jobs/expire-sweep.ts`, `node-cron`, раз в час, без payload):
`UPDATE "Link" SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND "expiresAt" < now()`.
Идемпотентно по конструкции — условие `WHERE` делает повторный запуск на том же состоянии БД no-op.

**daily-rollup** (`apps/api/src/jobs/daily-rollup.ts`, `node-cron`, ежедневно 00:10 UTC):
Payload: `{ date: string }` (ISO-дата суток, по умолчанию — вчера по UTC).
Логика: агрегирует `Click` за `date` по `linkId`, пишет в `DailyLinkStat` через `upsert` на составном ключе `(linkId, date)`.
Идемпотентно: повторный запуск с тем же `date` пересчитывает и перезаписывает `clickCount`, не прибавляет к нему.

**Запись клика** (не джоба — синхронный обработчик в редиректе, `apps/api/src/domains/links/redirect.ts`):
На каждый `GET /:uid` с активной ссылкой **и не-бот `User-Agent`** (см. «Bot-preview на редиректе» ниже): в одной транзакции — `INSERT INTO "Click"` и `UPDATE "Link" SET "clickCount" = "clickCount" + 1`. Не идемпотентно и не должно быть: каждый такой HTTP-запрос — реальное событие клика. Известное ограничение: префетч браузера/антивируса может завысить счётчик; не компенсируется в MVP.

**Fallback-редирект**: `uid` не найден, либо `status != ACTIVE` → `302` на `BASE_FALLBACK_URL` (env, по умолчанию `https://borozdov.ru`). Клик в этом случае не пишется.

**UTM на редиректе**: конечный URL = `targetUrl` с домерженными `utm_source`/`utm_medium`/`utm_campaign` (если заданы на ссылке) поверх существующих query-параметров таргета через `URL`/`URLSearchParams`.

**Bot-preview на редиректе** (`apps/api/src/domains/links/bot-preview.ts`): `GET /:uid` с активной ссылкой и `User-Agent`, совпадающим с известными ботами-анфёрлерами соцсетей/мессенджеров (`isBotUserAgent` — Telegram, Facebook/Instagram, Twitter/X, WhatsApp, Slack, Discord, LinkedIn, VK, Viber, Skype, Reddit, Pinterest) — сервер сам фетчит `targetUrl` и отдаёт `200 text/html` с зеркалированными `og:title`/`og:description`/`og:image` (fallback на `<title>`/`meta[name=description]`) вместо `302`. Требуется как минимум title, иначе — фолбэк ниже.
SSRF-guard на fetch: только `http`/`https`, резолв хоста через `dns.lookup` с отсевом приватных/loopback/link-local/multicast/metadata-адресов (`net.BlockList`) на каждом хопе редиректа (до 3 хопов), таймаут 6с, `content-type` обязан быть `text/html`. Тело читается потоково до первого `</head>` (не по фиксированному байт-кэпу — реальные страницы кладут произвольный объём разметки перед og-тегами, например у YouTube это ~700KB), с бэкстопом 1MB на случай незакрытого `<head>`.
Кэш результата — в памяти процесса API, ключ `targetUrl`, TTL 1 час (переживает рестарт контейнера как угодно — не персистентный, это не новая таблица в схеме).
Любая ошибка на любом шаге (DNS/SSRF-блок/таймаут/сеть/не-200/не-HTML/не нашли title) → откат на обычный `302` того же обработчика.
Клик не пишется НИ В ОДНОМ из двух случаев (успешное зеркалирование или откат на `302`) — бот не человек, вне зависимости от того, получилось ли зеркалирование.
Известное ограничение: SSRF-guard проверяет резолвленный на момент запроса адрес, не пиннит его на соединение — теоретический DNS rebinding между проверкой и `fetch()` не закрыт; сочтено неоправданным для MVP (нужен голый `http`/`https`-запрос с ручным управлением сокетом вместо глобального `fetch`).

## Общие типы

Путь: `packages/shared/src/`.

- `types/Link.ts` — `Link` (поля модели без `secretToken`/`ipHash`-деталей клиента, публичная проекция), `LinkStatus`.
- `types/Click.ts` — `Click`.
- `types/DailyLinkStat.ts` — `DailyLinkStat { linkId: string; date: string; clickCount: number }` — публичная проекция модели `DailyLinkStat` (даты в ISO), пишется `daily-rollup`.
- `types/ApiResponse.ts` — `ApiResponse<T> = { data: T } | { error: { code: string; message: string } }`. Оборачивает ответ каждого эндпоинта без исключений (используется в каждой задаче трека).
- `types/Theme.ts` — `Theme = 'obsidian' | 'titan'`. Используется `ThemeProvider`/`ThemeToggle` в общем layout (раздел «Скелет», п.4) — на нём рендерятся страницы всех задач.
- `schemas/create-link.ts` — Zod: `CreateLinkRequest { targetUrl: string; expiresInHours?: number; utm?: { source?: string; medium?: string; campaign?: string } }`, `CreateLinkResponse { shortUrl: string; uid: string; secretToken: string; qrUrl: string }`.
- `schemas/bulk-text.ts` — Zod: `BulkTextRequest { text: string }` (лимит 50 000 символов, максимум 200 ссылок за запрос), `BulkTextResponse { text: string; created: Array<{ original: string; short: string }> }`.
- `schemas/link-stats.ts` — Zod: `LinkStatsResponse { uid: string; shortUrl: string; status: LinkStatus; targetUrl: string; createdAt: string; expiresAt: string | null; clickCount: number; clicks: Array<{ occurredAt: string; referrer: string | null }> }`. `GET /api/links/stats/:secretToken`, без аккаунта. `clicks` — последние 100 по `occurredAt` desc, без пагинации в MVP.

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
- **Tabs** — переключение разделов внутри страницы.
- **ThemeToggle** — переключатель ОБСИДИАН/ТИТАН, мгновенный, без каскадного перехода.
- **StatCard** — карточка метрики, число — моноширинным с `tabular-nums`.
- **CopyButton** — копирует короткую ссылку в буфer, короткая анимация.
- **QRPreview** — превью QR с кнопкой скачивания PNG/SVG.
- **EmptyState** — пустой список ссылок/кликов.

## Владение инфраструктурой

За владельцем ядра (единственный трек, но правки — отдельным коммитом с явным описанием):

- Миграции: `apps/api/prisma/migrations/*`, генерируются из `schema.prisma`, применяются шагом деплоя (`prisma migrate deploy`).
- Сид-скрипт: `apps/api/src/db/seed.ts` — несколько демо-ссылок (активная, истёкшая, без клика) с демо-кликами для фейковых данных kitchen-sink/статистики.
- Конфиг: `apps/api/src/config/env.ts` и `apps/web/src/config/env.ts`, единая точка чтения переменных окружения.
- `.env.example` в корне — все переменные, без реальных секретов: `DATABASE_URL`, `BASE_LINK_DOMAIN`, `BASE_FALLBACK_URL`, `IP_HASH_SALT`.

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
- Секреты (`secretToken`) никогда не логируются и не попадают в публичные типы `Link`.

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
5. Каркас Express (`app.ts`, error-middleware) и каркас React (роутинг, layout, шапка с `ThemeToggle`).
6. `scheduler.ts` с демо-джобой (лог в консоль по `node-cron`), подключение `expire-sweep`/`daily-rollup` как заглушек.
7. Эталонная сквозная вертикаль: анонимное создание ссылки → редирект → запись клика (домен `links`, минимальный набор полей, без UTM/QR — это отдельные задачи трека).

Чек-лист «скелет готов»:

- [ ] `apps/api` и `apps/web` в main, оба стартуют локально одной командой из корня.
- [ ] `ThemeToggle` переключает ОБСИДИАН/ТИТАН мгновенно, выбор сохраняется (localStorage), при первом визите — из `prefers-color-scheme`.
- [ ] Все UI-примитивы из раздела «UI-примитивы» отрендерены на `/kitchen-sink`.
- [ ] `node-cron` гоняет демо-джобу, видно в логах.
- [ ] Миграции применяются на чистой БД, `seed.ts` наполняет демо-данными.
- [ ] Эталонная вертикаль (анонимное создание ссылки → редирект → клик) работает end-to-end в main.
- [ ] `.env.example` покрывает все переменные, приложение стартует без реальных секретов.

## Треки

Один трек — Track A, полное владение `apps/api`, `apps/web`, `packages/shared`. Задачи выполняются последовательно, каждая — отдельный вертикальный слайс и отдельный PR. Эталонный слайс для структуры — п.8 «Скелета» (анонимное создание ссылки → редирект → клик).

Что не трогать вне отдельного явного коммита: `apps/api/prisma/migrations/*`, схему в `prisma/schema.prisma`, `packages/shared` — правки контрактов и общих типов только через append в разделы «Схема данных»/«Общие типы» этого файла с бампом версии в «Changelog».

### Задача 1 — Создание ссылки: срок действия, QR

Цель: полноценное создание ссылки поверх эталонной вертикали — срок действия, QR.
Контракты/типы: `CreateLinkRequest`/`CreateLinkResponse`, правила генерации `uid` (раздел «Схема данных»).
Примитивы: Card (контейнер формы и результата), Input, Textarea, Select, Button, QRPreview, CopyButton, Toast.
Критерии приёмки: анонимный пользователь создаёт ссылку без логина; можно задать срок действия (без срока — бессрочно); ответ содержит короткую ссылку, QR (PNG/SVG) и ссылку на статистику по `secretToken`.
Тесты: контрактный на `CreateLinkResponse`, ошибка на невалидный `targetUrl`.

### Задача 2 — Истечение и fallback-редирект

Цель: `expire-sweep`, fallback на `borozdov.ru`, страница статистики по `secretToken`.
Контракты/типы: контракт `expire-sweep` и «Fallback-редирект» (раздел «Контракты фоновой работы и событий»).
Примитивы: Badge (статус ссылки), StatCard, Table.
Критерии приёмки: истёкшая/отключённая/несуществующая ссылка редиректит на `BASE_FALLBACK_URL`; `expire-sweep` переводит `ACTIVE` в `EXPIRED` по расписанию; страница `/s/:secretToken` показывает счётчик кликов и таймлайн без логина.
Тесты: путь ошибки (три случая fallback), идемпотентность `expire-sweep`.

### Задача 3 — Массовое сокращение ссылок в тексте

Цель: вставка большого текста, замена всех найденных URL на короткие ссылки, остальной текст не тронут.
Контракты/типы: `BulkTextRequest`/`BulkTextResponse`, лимиты (50 000 символов, 200 ссылок), правило пропуска URL на собственном домене.
Примитивы: Textarea, Button, CopyButton, Toast.
Критерии приёмки: смешанный текст (URL + обычный текст) на выходе — тот же текст с заменёнными ссылками; ссылки на `link.borozdov.ru` не сокращаются повторно; превышение лимита — понятная ошибка, ничего не создаётся частично.
Тесты: property-based на извлечение URL, контрактный на `BulkTextResponse`, путь ошибки (превышение лимита).

### Задача 4 — UTM-конструктор

Цель: UTM-конструктор при создании ссылки.
Контракты/типы: `utmSource`/`utmMedium`/`utmCampaign` на `Link` (уже в схеме), контракт «UTM на редиректе».
Примитивы: Input, Badge, CopyButton.
Критерии приёмки: при создании можно задать UTM-метки, они домерживаются в целевой URL при редиректе.
Тесты: контрактный на UTM-merge при редиректе.

## Очередь контрактов

Формат записи при `CONTRACT GAP`:

```
- Что нужно:
  Зачем:
  Предлагаемая форма:
  Временная заглушка:
  Статус: open | closed (vX)
```

- Что нужно: `GET /api/links/stats/:secretToken` response contract.
  Зачем: страница `/s/:secretToken` (Задача 2) показывает статус, счётчик кликов и таймлайн кликов без логина.
  Предлагаемая форма: `schemas/link-stats.ts` — `LinkStatsResponse` (см. раздел «Общие типы»).
  Временная заглушка: не потребовалась — единственный трек, гэп закрыт в том же PR отдельным контрактным коммитом перед фиче-кодом.
  Статус: closed (v2)

Записи, закрытые в v3/v4/v5 (аккаунты, личный кабинет, claim, API-ключи), удалены в v7 вместе с контрактами, которые они описывали — см. Changelog v7.

- Что нужно: расширение контракта `GET /:uid` — ветка ответа для `User-Agent` известных ботов-анфёрлеров соцсетей (`200 text/html` с зеркалированными og-тегами целевой страницы вместо `302`).
  Зачем: превью коротких ссылок в Telegram/WhatsApp/Twitter/т.п. показывает реальный контент цели, а не пустую карточку — не все боты идут по `302` сами.
  Предлагаемая форма: см. «Bot-preview на редиректе» в разделе «Контракты фоновой работы и событий». Не JSON-контракт (нет нового типа/схемы в `packages/shared`) — HTML-ответ того же эндпоинта.
  Временная заглушка: не потребовалась — гэп закрыт в том же PR отдельным контрактным коммитом перед фиче-кодом (как v2).
  Статус: closed (v8)
