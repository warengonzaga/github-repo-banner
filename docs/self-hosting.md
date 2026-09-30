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

Every instance serves its own documentation at `/docs` and public usage page at `/usage`. The usage page reads that same instance's `/stats` endpoint; it does not contact the official service for statistics. By default, set `ENABLE_STATS=true` to expose daily observations, or leave it off to show an explicit tracking-disabled state. The raw JSON API remains available at `/stats`. Saved exported designs and public community showcasing require official-hosted mode. Count-only export requests follow the optional tracking setting.

```env
PORT=3000                         # Server port (host port with Compose)
NODE_ENV=development              # Docker image uses production
REDIS_URL=redis://localhost:6379   # Required; Compose supplies its internal URL
ENABLE_STATS=false                # Optional daily aggregate observations
OFFICIAL_HOSTED_INSTANCE=false     # Keep false for ordinary self-hosting
EXPORT_RETENTION_DAYS=            # Required in official mode: integer 1–365
PUBLIC_ORIGIN=                    # External origin when behind a proxy
PEXELS_API_KEY=                    # Optional server-side Pexels search
```

See [`.env.example`](../.env.example). Disabling tracking does not disable Redis caching or quota control. With optional tracking enabled, individual banner and page requests can opt out with `stats=false`, `DNT: 1`, or `Sec-GPC: 1`. No API key is needed for direct image URLs or banner rendering.

### Public origin and reverse proxies

Set `PUBLIC_ORIGIN` to the exact external origin when a reverse proxy or hosting platform terminates HTTPS, for example `https://banners.example.com`. Supply only the scheme, hostname and optional port, with no path, query, fragment or credentials. This allows the browser's export and showcase-removal requests to pass the origin check even when the app receives internal HTTP traffic. Arbitrary forwarded headers are not trusted for this check.

When `PUBLIC_ORIGIN` is unset, official-hosted mode defaults to `https://ghrb.waren.build`. Ordinary self-hosted mode instead uses the request origin, which works for direct HTTP access. Set an explicit value for a custom official-mode domain or local test, such as `http://localhost:3000`; the official default does not follow the current request hostname.

### Official-hosted mode

The official service uses `OFFICIAL_HOSTED_INSTANCE=true`. This forces aggregate counting even if `ENABLE_STATS=false`, removes the optional statistics control, saves every design submitted through its built-in export controls, and enables the public showcase. In this mode, `stats=false`, `DNT: 1`, and `Sec-GPC: 1` do not disable counting or export saving. The explicit showcase choice controls public display only.

Leave this flag off for ordinary self-hosting. If you enable the same behavior on your own instance, make the operator and applicable service policies clear to your users; this repository's official-service Terms do not identify you as its operator. The site's notices must match how you configure it.

Official mode also requires `EXPORT_RETENTION_DAYS`, an explicit integer from 1 to 365 with no default. Startup fails if it is missing or invalid. Choose and disclose the retention period before deploying official mode. Each saved export expires after that period; identical retries do not extend it. Ordinary self-hosting does not save export designs and does not require this setting.

Public showcase copies persist separately until withdrawn or removed. Withdrawal removes the public copy and listing, not the saved export before its expiry. The gallery holds at most 1,000 entries; when full, new exports still save and count while returning a clear non-publication status. Existing entries are not silently evicted. Back up Redis as needed; retained backups require their own handling and retention policy.

## Upgrade and Availability

**Breaking configuration change in 2.0.0:** every deployment now requires Redis, even with `ENABLE_STATS=false`. Existing deployments must provision Redis and set `REDIS_URL` before upgrading. Startup fails with a credential-free error if the URL is missing/invalid or Redis cannot be reached; the HTTP listener does not start.

During an outage, `/health` returns 503 and Pexels search returns 503 without bypassing the request budget. The app reconnects automatically when Redis recovers. Plain banner rendering remains available directly from the running process, but a hosting platform may remove unhealthy instances from traffic. Statistics remain optional with the default self-hosted configuration; `/stats` reports storage failures when tracking is enabled. Ordinary self-hosted export counting is best effort and does not block exporting during a statistics outage. Official built-in exports require available storage for the saved design; unconfirmed saves or publications are reported rather than silently claiming success. Retry the same export after storage recovers.

## Railway Deployment

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT)

1. Add a Redis service and persistent storage to your Railway project.
2. Set the banner service's `REDIS_URL` to that Redis service's connection URL.
3. Keep `ENABLE_STATS=false`, or set it to `true` to enable aggregate usage observations. Set `PEXELS_API_KEY` only if you want image search.
4. Set `PUBLIC_ORIGIN` to the service's external HTTPS origin, such as `https://banners.example.com`.
5. Deploy using this repository's Dockerfile and configure `/health` as the readiness endpoint.

The existing hosted template may need its Redis service and variables added before deployment. A repository change does not update a saved Railway template automatically.

### Statistics availability

Recording failures emit a payload-free operational error. The affected process returns `/stats` as unavailable for the remainder of that UTC day, since later writes cannot recover lost observations. This health signal is process-local and resets on restart; it is not fleet-wide monitoring. Counter and cardinality reads use one Redis transaction.

## CI and Release Workflow

[`.github/workflows/build-flow.yml`](../.github/workflows/build-flow.yml) retains Build Flow's pinned CI workflow for Node 22, Bun 1.3.9, frozen dependency installation, static checks, and the production build. A separate Redis and Docker job runs the regression scripts against a disposable Redis service, checks startup failures, and builds and smoke-tests Compose. The `Build` gate requires both jobs to pass.

Only a push to `main` can release, after that gate succeeds. Release Build Flow Action v1.8.0 uses the automatically supplied `GITHUB_TOKEN` with `contents: write`; no personal token is needed. Token-generated push, tag, and release events do not trigger additional workflow runs. A successful new release then runs Container Build Flow Action v1.9.0 in the same workflow. It checks out the release tag (including the updated package version) and publishes Linux AMD64 and ARM64 images to both `warengonzaga/github-repo-banner` on Docker Hub and `ghcr.io/warengonzaga/github-repo-banner` on GHCR. Tags include `X.Y.Z`, `X.Y`, `X`, and `latest`.

Docker Hub uses repository secrets `DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN`; the credentials need push access to `warengonzaga/github-repo-banner`. GHCR uses only the automatically supplied `GITHUB_TOKEN` with `packages: write`. No GHCR personal token is needed. The publishing job also has `security-events: write` for the action's default security scan reports.

PRs and pushes to `dev` validate without publishing. Release and publishing runs on `main` are serialized so floating image tags stay in order. Both registries must report success; if publishing fails after the release was created, use **Re-run failed jobs** to retry the publishing job with the original release outputs. Retries of a superseded release are rejected before publishing so they cannot roll floating tags back to an older version. Package visibility and registry access are configured in the registry; successful publication alone does not guarantee anonymous pulls. Railway can still build the Dockerfile directly from the repository.

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

Fonts, icons, emoji assets, and remote images can depend on external services; deployments need outbound access for these features. Background downloads can fall back to a gradient. A failed custom inline icon or positioned image instead returns HTTP 422 and blocks the generator’s exports until the image is fixed or removed. Custom images need no additional API key or storage service.

## Resource limits

Backgrounds, inline custom icons, and positioned images share a process-local 32 MiB accounted-string cache with a 60-second TTL and at most four active downloads/decodes. Up to sixteen additional loads wait for a slot; beyond that, new loads are rejected. Requests for the same URL and size limit share in-flight work. Background downloads are limited to 10 MiB; each custom icon or positioned image is limited to 1 MiB. Failed or saturated background downloads use the existing fallback; custom-image failures return an error. Sharp validates image bytes with raster-only buffer decoders before caching. The declared media type must match the decoded format. All animation frames count toward a 16,777,216-pixel limit, and decoding has a five-second processing deadline. The Docker image includes Sharp’s native runtime dependencies. These limits bound retained image data, not total process memory; decoding temporarily allocates additional memory.

Each banner permits five custom images across positioned layers and both text fields. Custom URLs are limited to 512 units, and the `images` JSON parameter to 4,096 units before URL encoding. Only direct public HTTPS raster images are accepted; SVG, redirects, credentials, and private addresses are rejected. See [custom image settings](api.md#custom-icons-and-positioned-images) for geometry, formats, and inline syntax.

Pexels responses live in Redis for five minutes, limited to 64 KiB per response. Each process permits four concurrent upstream fetches and coalesces identical in-flight requests. A Redis script atomically enforces 100 upstream attempts per rolling hour per API key; failed upstream attempts count too. Queries are normalized and cache keys hash the query URL and API key. Quota entries hold timestamps and random request identifiers, with a one-hour expiry. Cache hits consume no quota; excess uncached requests receive HTTP 429. The budget survives app restarts and is shared only by instances using the same Redis database and API key. Other tools using that Pexels account remain outside this budget.

Image caching remains in process memory; image binaries are not stored in Redis. Saved exports and showcase copies store normalized settings, including custom image URLs and layout, rather than rendered image binaries. Sources must remain available for later previews. Existing saved designs without custom images require no migration. Official mode admits at most 60 new exports per rolling minute and retains at most 5,000 saved records, each limited to 8 KiB; public copies are separately capped at 1,000. These shared Redis limits reject new submissions before saving or counting, without evicting retained designs. Plan retention and capacity together; a full archive prevents new official exports until space expires. Existing identical retries still work at capacity. Bounded expiry and rolling-admission indexes contain only export IDs and timestamps; no permanent withdrawal markers are needed. Tracking opt-outs do not disable operational search caches or quota entries.

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
