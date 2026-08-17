# Деплой

Три контейнера: `db` (Postgres), `api` (Express), `web` (статика SPA + Caddy как reverse proxy с автоматическим HTTPS).

## Один раз на сервере

1. Установить Docker и Docker Compose plugin.
2. Направить A/AAAA-запись домена на IP сервера, открыть порты 80 и 443.
3. Склонировать репозиторий.
4. `cp .env.production.example .env.production` и заполнить реальными значениями:
   - `POSTGRES_PASSWORD` — пароль БД.
   - `DOMAIN` — реальный домен (Caddy сам выпустит сертификат Let's Encrypt).
   - `BASE_LINK_DOMAIN` — `https://<DOMAIN>`.
   - `IP_HASH_SALT` — длинная случайная строка (`openssl rand -hex 32`).

## Запуск

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

`api` при старте сам выполняет `prisma migrate deploy` перед запуском сервера (см. `apps/api/docker-entrypoint.sh`).

## Обновление после нового коммита

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Миграции применяются автоматически при рестарте `api`.

## Проверка

```bash
docker compose -f docker-compose.prod.yml ps
curl -I https://<DOMAIN>/health   # проксируется в api, должен быть 200 после первого деплоя
```

`api` и `web` — restart: unless-stopped и с healthcheck, `db` — именованный volume `db-data`, не переживёт только полное удаление volume.

## Логи

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

## Бэкап БД

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U shortlink shortlink > backup.sql
```

## Известное допущение

Прод-рантайм API — `tsx` поверх исходников (`docker-entrypoint.sh`), не `tsc`-сборка + `node`: `packages/shared` не собирается в `dist` (нет build-шага и `.js`-расширений в экспортах), поэтому чистый `node dist/server.js` падает с `ERR_MODULE_NOT_FOUND` при попытке резолвнуть `@short-link/shared` как рантайм-модуль. Правка `packages/shared` — вне рамок этой задачи (см. CLAUDE.md, «Запрещено»). Если понадобится честная compiled-сборка API — нужен отдельный коммит с build-шагом для `packages/shared`.
