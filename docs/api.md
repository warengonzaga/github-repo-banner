# API Reference

[Back to README](../README.md) · [Banner rendering](rendering.md) · [Public pages](pages.md) · [Self-hosting](self-hosting.md)

This reference lists the service’s JSON API endpoints. Banner rendering is documented separately in the [Banner Rendering guide](rendering.md), and browser-facing routes are listed in the [Public Pages guide](pages.md).

## `GET /api/pexels/search`

Server-side Pexels search used by the generator. Accepts `q` (default `nature`, normalized and limited to 100 units) and `page` (default 1). Returns up to nine landscape photos per page:

```json
{
  "photos": [
    {
      "id": 123,
      "alt": "Example landscape",
      "photographer": "Example photographer",
      "url": "https://images.example.com/landscape.jpg",
      "thumb": "https://images.example.com/thumbnail.jpg"
    }
  ],
  "total": 10,
  "page": 1,
  "hasMore": true
}
```

The image URLs above are illustrative. Request the next page while `hasMore` is true; an empty page ends pagination. Missing Pexels configuration or unavailable Redis returns HTTP 503, exhausted per-process concurrency or shared Redis budget returns 429 with `Retry-After: 60`, and upstream failures return 500. See the [self-hosting guide](self-hosting.md).

## `GET /api/health`

Readiness endpoint with `Cache-Control: no-store`. Returns HTTP 200 when Redis answers a ping, or HTTP 503 when Redis is unavailable. The response includes database availability and whether optional usage stats are enabled.
