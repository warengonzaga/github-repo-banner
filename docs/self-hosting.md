# Self-Hosting and Development

[Back to README](../README.md) · [API reference](api.md)

## Docker Compose (Recommended)

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
cp .env.example .env
docker compose up --build -d
```

Open `http://localhost:3000`. Compose runs one Node 22 app and one Redis 8 service. It supplies `REDIS_URL` automatically; Redis is not published to the host. The app runs as a non-root user and binds to localhost by default. Put a reverse proxy in front for public HTTPS access. Set `PORT` in `.env` to change the host port.

Redis uses a named volume and AOF persistence (default every-second fsync). App restarts preserve cached searches and quota usage until expiry. This is not zero-loss durability: abrupt host failure may lose recent writes. `docker compose down` preserves the volume; adding `--volumes` deletes it. Back up the volume as needed.

Redis has a 128 MiB data budget with `noeviction`, so memory pressure rejects writes instead of silently discarding quota or statistics. The container has a 256 MiB memory limit, including overhead; adjust these together if workload requires it. On an external Redis service, use `noeviction` and persistence too. Deleting Redis data resets caches and quotas.

## Run Locally Without Docker

Use Node.js 22, Bun 1.3.9, and a running Redis service:

```bash
bun install --frozen-lockfile
cp .env.example .env
# Set REDIS_URL in .env to your Redis connection URL.
bun dev
```

For a production build, run `bun run build`, then `bun run start` with `NODE_ENV=production`. Redis supports `redis://` and TLS `rediss://` URLs. Production secrets belong in the service's runtime environment, never in the image.

The banner API and Pexels proxy require the running server. GitHub Pages alone cannot run these endpoints, and a GitHub Actions secret does not automatically become a Railway runtime variable.

## Environment Variables

```env
PORT=3000                         # Server port (host port with Compose)
NODE_ENV=development              # Docker image uses production
REDIS_URL=redis://localhost:6379   # Required; Compose supplies its internal URL
ENABLE_STATS=false                # Optional daily aggregate observations
PEXELS_API_KEY=                    # Optional server-side Pexels search
```

See [`.env.example`](../.env.example). Disabling tracking does not disable Redis caching or quota control. With tracking enabled, individual banners can opt out with `stats=false`, `DNT: 1`, or `Sec-GPC: 1`. No API key is needed for direct image URLs or banner rendering.

## Upgrade and Availability

**Breaking configuration change:** every deployment now requires Redis, even with `ENABLE_STATS=false`. Existing deployments must provision Redis and set `REDIS_URL` before upgrading. Startup fails with a credential-free error if the URL is missing/invalid or Redis cannot be reached; the HTTP listener does not start.

During an outage, `/health` returns 503 and Pexels search returns 503 without bypassing the request budget. The app reconnects automatically when Redis recovers. Plain banner rendering remains available directly from the running process, but a hosting platform may remove unhealthy instances from traffic. Statistics remain optional; `/stats` reports storage failures when tracking is enabled.

## Railway Deployment

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT)

1. Add a Redis service and persistent storage to your Railway project.
2. Set the banner service's `REDIS_URL` to that Redis service's connection URL.
3. Keep `ENABLE_STATS=false`, or set it to `true` to enable aggregate usage observations. Set `PEXELS_API_KEY` only if you want image search.
4. Deploy using this repository's Dockerfile and configure `/health` as the readiness endpoint.

The existing hosted template may need its Redis service and variables added before deployment. A repository change does not update a saved Railway template automatically.

### Statistics availability

Recording failures emit a payload-free operational error. The affected process returns `/stats` as unavailable for the remainder of that UTC day, since later writes cannot recover lost observations. This health signal is process-local and resets on restart; it is not fleet-wide monitoring. Counter and cardinality reads use one Redis transaction.

## CI and Release Workflow

[`.github/workflows/build-flow.yml`](../.github/workflows/build-flow.yml) retains Build Flow's pinned CI workflow for Node 22, Bun 1.3.9, frozen dependency installation, static checks, and the production build. A separate Redis and Docker job runs the regression scripts against a disposable Redis service, checks startup failures, and builds and smoke-tests Compose. The `Build` gate requires both jobs to pass.

Only a push to `main` can release, after that gate succeeds. Release Build Flow Action v1.8.0 uses the automatically supplied `GITHUB_TOKEN` with `contents: write`; no personal token is needed. Token-generated push, tag, and release events do not trigger additional workflow runs. The workflow builds the Docker image for verification; it does not publish to a registry. Railway can build the Dockerfile directly from the repository.

## Commands

```bash
bun dev      # Development with hot-reload
bun run build    # Production build
bun run start    # Start production server
```

## Security

- Input sanitization (XSS prevention)
- Hex color validation
- Header length limits
- Shared image URL validation and public-address checks before HTTPS downloads
- Image content-type, size, timeout, cache, and concurrency limits
- Pexels credentials stay server-side; cached searches and request budgets reduce upstream calls

Fonts, icons, emoji assets, and remote images can depend on external services. Unavailable assets may fall back; deployments need outbound access for these features.

## Resource limits

Background image downloads share a process-local 32 MiB accounted-string cache with a 60-second TTL and at most four concurrent fetches. Requests for the same URL share in-flight work; saturation or failed downloads use the existing fallback. Each download remains limited to 10 MiB. These limits bound retained image data, not total process memory.

Pexels responses live in Redis for five minutes, limited to 64 KiB per response. Each process permits four concurrent upstream fetches and coalesces identical in-flight requests. A Redis script atomically enforces 100 upstream attempts per rolling hour per API key; failed upstream attempts count too. Queries are normalized and cache keys hash the query URL and API key. Quota entries hold timestamps and random request identifiers, with a one-hour expiry. Cache hits consume no quota; excess uncached requests receive HTTP 429. The budget survives app restarts and is shared only by instances using the same Redis database and API key. Other tools using that Pexels account remain outside this budget.

Background image caching remains in process memory; large image binaries are not stored in Redis. Tracking opt-outs do not disable operational search caches or quota entries.

## Regression Checks

Use an empty, disposable Redis instance for integration checks; never point them at production. `TEST_REDIS_URL` is required and does not fall back to `REDIS_URL`.

```bash
bun run build
TEST_REDIS_URL=redis://127.0.0.1:6379 bun scripts/check-pexels-route.ts
TEST_REDIS_URL=redis://127.0.0.1:6379 bun scripts/check-redis-connection.ts
bun scripts/check-redis-startup.ts
sh scripts/check-docker.sh
```

Pexels responses in these checks are fixtures; no live API key is needed. The Docker check creates and removes its own containers and volume, without reading local `.env` secrets.
