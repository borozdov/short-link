# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# BOROZDOV LINK

Единственный источник истины — `tech.md` в корне репозитория. Подчиняться ему дословно: схема данных, контракты, общие типы, конвенции кода, тесты, Definition of Done. Читать `tech.md` перед любой задачей, затрагивающей контракты/схему/треки.

## Трек текущей сессии

Track A — единственный трек проекта. Полное владение: `apps/api`, `apps/web`, `packages/shared`. Список задач, критерии приёмки и эталонный слайс — раздел «Треки» в `tech.md`. Задачи выполняются по порядку, одна за раз.

## CONTRACT GAP

Контракта, типа, поля или payload нет в `tech.md` → стоп, код с выдуманным типом не пишется. Выдать блок `CONTRACT GAP` (форма — раздел «Очередь контрактов» в `tech.md`), дописать запись в эту секцию, продолжить работу на локальной заглушке до обновления ядра.

## Запрещено

Правка `apps/api/prisma/migrations/*`, `packages/shared` и раздела «Схема данных»/«Общие типы» в `tech.md` вне отдельного коммита с явным описанием изменения контракта и бампом версии ядра (см. Changelog в `tech.md`).

## Порядок работы

Одна задача из «Треки» за раз, один слайс — один PR. Маленькие коммиты по Conventional Commits (`type(scope): summary`, английский), тайпчек проходит на каждом коммите. Перед PR — прогнать Definition of Done из `tech.md`.

## Commands

Run from repo root (npm workspaces monorepo).

```bash
npm run dev                                  # api (4000) + web concurrently
npm run typecheck                            # tsc --noEmit across all workspaces
npm run lint                                 # eslint .
npm run test                                 # vitest run across all workspaces
npm run build                                # api tsc build + web vite build
```

`apps/bot` (Telegram bot) is not part of the default `npm run dev` — it needs `TELEGRAM_BOT_TOKEN`, which most local setups don't have. Run it explicitly:

```bash
npm run dev --workspace apps/bot             # tsx watch src/index.ts, long polling
```

Single workspace / single test file:

```bash
npm run dev --workspace apps/api             # tsx watch src/server.ts
npm run test --workspace apps/api            # vitest run
npx vitest run apps/api/test/links/redirect.test.ts
npx vitest run apps/web/test/features/shorten/ShortenForm.test.tsx
```

Prisma (`apps/api`, from that workspace or with `--workspace apps/api`):

```bash
npm run prisma:migrate:dev --workspace apps/api      # new migration, local db
npm run prisma:migrate:deploy --workspace apps/api   # apply pending migrations (also runs on container start, see docker-entrypoint.sh)
npm run prisma:generate --workspace apps/api
npm run prisma:seed --workspace apps/api             # apps/api/src/db/seed.ts — demo links/clicks
```

There is no CI; `npm run lint && npm run typecheck && npm run test` locally is the gate before a PR, per Definition of Done in `tech.md`.

## Architecture

Monorepo: `apps/api` (Express + Prisma/Postgres), `apps/web` (React + Vite SPA), `apps/bot` (Telegram bot, grammY, long polling), `packages/shared` (Zod schemas + types consumed by all three — this is the actual API contract, not just documentation of it).

**No accounts, ever.** There is no login, no user model, no ownership on links. Access to a link's stats is solely by possessing its `secretToken` (a second, private URL/QR distinct from the short link itself). Do not reintroduce auth-shaped code (e.g. `Authorization` headers, `ownerId`) without a `tech.md` contract bump — accounts existed through v6 and were fully removed in v7 (see Changelog).

**`apps/api/src/domains/links/`** holds all link logic as flat files, not classes: `create.ts` (POST, uid generation via nanoid base62/7, ≤5 collision retries), `redirect.ts` (GET /:uid — the click-recording path), `bot-preview.ts` (GET /:uid branch for social-bot user agents — see below), `stats.ts`, `bulk-text.ts` (linkify-it extraction), `qr.ts`, `uid.ts`, `url-extraction.ts`, `ip-hash.ts`.

**`GET /:uid` has three outcomes**, decided in this order — know which one a change affects:
1. Bot User-Agent (Telegram/WhatsApp/Twitter/etc, see `isBotUserAgent`) + active link → SSRF-guarded server-side fetch of the target, mirrors its `og:title`/`og:description`/`og:image` as a `200 text/html` response. In-memory cache (per-process, 1h TTL, keyed by `targetUrl`). Any failure at any step falls through to outcome 3.
2. Active, non-bot → `302` to `targetUrl` with UTM params merged in, plus a `Click` insert and `Link.clickCount` increment in one transaction.
3. Expired/disabled/nonexistent, or bot-preview fallback → `302` to `BASE_FALLBACK_URL`. No `Click` row is written for this or for outcome 1 — only outcome 2 represents a real visit.

**Background jobs** (`apps/api/src/jobs/`, in-process `node-cron`, no external queue): `expire-sweep.ts` (hourly, flips `ACTIVE`→`EXPIRED` past `expiresAt`) and `daily-rollup.ts` (00:10 UTC, aggregates `Click` into `DailyLinkStat` via upsert). Both are designed to be idempotent re-run on the same DB state/payload — preserve that when touching them, it's an explicit test requirement (see `tech.md` § Тесты).

**`apps/bot/src/`** is a thin Telegram client, no database of its own: `api-client.ts` calls the same `apps/api` HTTP endpoints as `apps/web` (`createLink`, `getLinkStats`, `updateLinkStatus`), `keyboard.ts` builds the inline keyboard attached to every bot reply (stats / enable-disable), `handlers/` wires message and callback-query handling. A link's `secretToken` lives only inside that reply message's `callback_data` — the bot never persists it anywhere, so "managing" a link works only through that Telegram message's own buttons, not a list view.

**`packages/shared/src/`** is the contract boundary: `schemas/*` are Zod schemas that both validate API input and derive the shared TypeScript types (`types/*`) — never hand-write a duplicate type that a Zod schema already implies. Every API response is wrapped in `ApiResponse<T> = { data: T } | { error: { code, message } }`, enforced through the central error-middleware (`apps/api/src/middleware/error-handler.ts`) — no bare `throw` should reach the client uncaught.

**`apps/web/src/primitives/`** is a from-scratch UI kit (no component library), styled per the BOROZDOV design system (see `borozdov-style` skill / `BRAND.md`): monochrome, inversion as the only accent, hairline borders, tabular-nums for numbers. All primitives are rendered together on the `/kitchen-sink` route — check there when changing a primitive's API. Theming (`apps/web/src/theme/`) is two hand-authored palettes, ОБСИДИАН (dark) and ТИТАН (light), switched instantly via CSS variables with no transition, persisted to `localStorage`, defaulting to `prefers-color-scheme`.

**Database** (`apps/api/prisma/schema.prisma`): `Link` (uid, targetUrl, secretToken, status, expiresAt, UTM fields, denormalized `clickCount`), `Click` (one row per real visit, `ipHash` only — raw IPs are never stored), `DailyLinkStat` (composite-keyed `linkId+date` rollup). Full model definitions and generation rules are in `tech.md` § Схема данных — that copy is authoritative; the `.prisma` file must match it exactly.

## Localization

UI and user-facing error text are Russian-only, hardcoded (no i18n library). Write new UI/error text directly in Russian.
