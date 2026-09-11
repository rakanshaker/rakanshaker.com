# Portfolio Videos (Creative section)

## Goal

Add a "Videos" tab to the `/portfolio` ("Creative") page, alongside the existing photo grid, so Rakan can publish Vimeo-hosted videos through Sanity the same way photos are published today.

## Why Vimeo + Sanity (not self-hosted uploads)

Sanity's free tier is 5GB of asset storage — fine for photos, tight for video. Hosting the actual video files on Vimeo keeps Sanity as the lightweight source of truth (just a URL + metadata) while Vimeo handles encoding, adaptive streaming, and bandwidth.

## Data model

New Sanity document type `video` (`studio/schemaTypes/video.ts`), added to `schemaTypes/index.ts`, parallel to the existing `photo` type:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Optional |
| `vimeoUrl` | string | Required. Validated to look like a `vimeo.com` URL. |
| `caption` | text | Optional |
| `order` | number | Optional. Lower numbers sort first; falls back to `_createdAt` — same convention as `photo.order`. |

No batch-upload variant (unlike `photoBatch`) — videos are added one at a time. Can be added later if that changes.

## Fetching data

`src/portfolio/lib/sanity.js` gets a new `fetchVideos()` function, structured like `fetchPhotos()`: queries `*[_type == "video"]`, sorts by `order` then `_createdAt` descending.

## Thumbnails and playback (Vimeo oEmbed)

A new `src/portfolio/lib/vimeo.js` calls Vimeo's public oEmbed endpoint:

```
https://vimeo.com/api/oembed.json?url=<encoded vimeoUrl>
```

This works for unlisted videos too (the private hash in the URL is handled by Vimeo automatically) and requires no API key. The response is cached in-memory per URL for the session (one network call per video, not per render). Two things it returns are used:

- `thumbnail_url` — feeds the grid tile image.
- `html` — a ready-made `<iframe>` embed snippet, reused as-is for playback (avoids manually reconstructing player URLs/hashes).

## Components

- **`src/portfolio/components/VideoGrid.js`** — parallel to `PhotoGrid.js`. Renders a grid of buttons; each fetches its own oEmbed data on mount to show `thumbnail_url` as the tile image, with a play-icon overlay. Clicking calls `onSelect(video)`.
- **`src/portfolio/components/VideoLightbox.js`** — parallel to `Lightbox.js`. Same modal pattern (overlay, Escape to close, click-outside to close, body scroll lock) but renders the cached oEmbed `html` via `dangerouslySetInnerHTML` instead of an `<img>`. Shows title/caption from the Sanity doc below the player if present. No forced autoplay — the visitor presses play (unmuted autoplay is unreliable across browsers anyway).

## Page structure

`src/pages/PortfolioPage.js`:

- Adds a small tab switcher ("Photos" / "Videos") below the header, active tab in local state (default: Photos).
- Fetches both `fetchPhotos()` and `fetchVideos()` on mount (in parallel), each with its own `loading`/`error` state, so a failure in one doesn't block the other.
- Renders `PhotoGrid`+`Lightbox` or `VideoGrid`+`VideoLightbox` depending on the active tab, reusing the existing `gallery-status` / `gallery-status--error` styling and the same "missing config" / "fetch failed + CORS hint" error messages already used for photos.

## Testing

- Manual: add a `video` document in Sanity Studio with a real Vimeo URL the user provides, confirm it appears in the Videos tab, thumbnail loads, click opens the modal, video plays, Escape/click-outside closes it.
- Manual: unlisted Vimeo link (with private hash) to confirm oEmbed + embed still work.
- Manual: missing/invalid `vimeoUrl` handled gracefully — if the oEmbed fetch fails for a given video, that tile is simply omitted from the grid (logged to console), and it doesn't break the other tiles.
