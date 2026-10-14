# GitHub Repo Banner API

This is the local banner service at http://127.0.0.1:3000. It is public. There is no sign-in and no Authorization header. Stay on this origin. Requests to https://ghrb.waren.build are out of scope.

A 401 or 403 is not expected here. A 400 or 422 on an invalid banner is expected. A 503 from Pexels search is expected when no Pexels key is configured.

## Important requests

- `GET /health` returns JSON. With Redis up, `status` is `ok` and `database.available` is true.
- `GET /banner?header=Hello&subheader=World&bg=1a1a1a-4a4a4a&color=ffffff` returns `image/svg+xml` and the SVG contains the header text.
- `GET /banner?header=Hello&bg=zzzz` returns 400 JSON, not an image.
- `GET /stats` returns JSON with `enabled: false` and a message that tracking is disabled.
- `GET /api/pexels/search?q=nature` returns 503 JSON `Pexels API not configured`. That is expected. Do not report it as a bug.
- `GET /`, `GET /docs`, and `GET /usage` return HTML.
- `POST /exports` with an empty JSON body should fail with a client error, not a 500. Do not send a real image binary.
- `POST /log` returns JSON and does not record usage while tracking is disabled.

## Never do these things

- Do not call any host except http://127.0.0.1:3000.
- Do not send `DELETE /showcase/...`.
- Do not post export bodies that contain private URLs, credentials, or tokens.
- Do not change environment variables, Redis, or files in the repo.
