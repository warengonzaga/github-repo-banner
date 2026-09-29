# Self-Hosting and Development

[Back to README](../README.md) · [API reference](api.md)

## Run Locally

Use Node.js 22 and Bun 1.3.9 (the version pinned by this project).

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
bun install --frozen-lockfile
cp .env.example .env
bun dev
```

Open `http://localhost:3000`. Set optional variables in `.env` before starting the server; production deployments should set them in the service's runtime environment. For a production build, run `bun build`, then `bun start` with `NODE_ENV=production`.

The banner API and Pexels proxy require the running server. GitHub Pages alone cannot run these endpoints, and a GitHub Actions secret does not automatically become a Railway runtime variable.

## Environment Variables

```env
PORT=3000              # Server port
NODE_ENV=development   # Environment mode

# Stats Tracking (disabled by default - privacy-first)
ENABLE_STATS=false     # Daily aggregate observations, not individual tracking
REDIS_URL=             # Required only if ENABLE_STATS=true

# Optional server-side image search
PEXELS_API_KEY=         # Required only for Pexels search
```

See [`.env.example`](../.env.example) for runtime configuration. The release workflow uses the automatically supplied `GITHUB_TOKEN`; no personal access token secret is required.

## Railway Deployment

### Basic Deployment (Stats Disabled - Default)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT)

No additional configuration needed. The service runs without stats tracking.

### With Stats Tracking (Optional)

If you want aggregate usage observations for your instance:

1. **Deploy the service** using the button above
2. **Add Redis service** in Railway dashboard:
   - Click "New" → "Database" → "Add Redis"
   - Set `REDIS_URL` on the banner service to the Redis service connection URL
3. **Enable stats** in your service variables:
   - Go to your service settings
   - Add variable: `ENABLE_STATS=true`
4. **Redeploy** your service

**Accessing Stats:**

- View at: `https://your-service.railway.app/stats`
- Health check includes stats status: `https://your-service.railway.app/health`

Redis is optional and only used for statistics. Image caching and Pexels throttling use process-local memory.

### Statistics availability

Recording failures emit a payload-free operational error. The affected process returns `/stats` as unavailable for the remainder of that UTC day, since later writes cannot recover lost observations. This health signal is process-local and resets on restart; it is not fleet-wide monitoring. Counter and cardinality reads use one Redis transaction.

## CI and Release Workflow

[`.github/workflows/build-flow.yml`](../.github/workflows/build-flow.yml) calls Build Flow's CI reusable workflow pinned to the v0.2.1 commit. It keeps Node 22, Bun 1.3.9, frozen dependency installation, `bun run check`, and `bun run build` (including declaration generation). Regression scripts are available under `scripts/check-*`, but CI does not currently run them. There is no separate test, coverage, or typecheck command in the pipeline; the reusable workflow's defaults are explicitly overridden to preserve that behavior. The existing `Build` check name remains as a CI-dependent gate.

Only a push to `main` can release, after the Build gate succeeds. The pinned Release Build Flow Action v1.8.0 uses `GITHUB_TOKEN` with `contents: write` on the release job for version and changelog updates, tags, and GitHub Releases. Token-generated push, tag, and release events do not trigger additional workflow runs. The separate CI and release workflow files are replaced by this single workflow to avoid duplicate release jobs.

Railway handles application builds and deployments directly from the GitHub repository. Package and container registry publishing are not part of this workflow; no Dockerfile or full `app.yml` orchestration is needed. This CI-plus-release configuration is the intended scope of issue #52.

## Commands

```bash
bun dev      # Development with hot-reload
bun build    # Production build
bun start    # Start production server
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

Pexels responses use a process-local 2 MiB cache for five minutes, four concurrent fetches, and a rolling budget of 100 upstream requests per hour. Queries are normalized before caching. Cached results do not consume that budget; excess uncached requests receive HTTP 429. Replicas sharing a Pexels key need a shared limiter to enforce an account-wide budget; process restart resets the local budget.
