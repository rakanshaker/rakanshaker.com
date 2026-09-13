# Portfolio Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Videos" tab to the `/portfolio` page so Vimeo-hosted videos, managed in Sanity, can be published alongside the existing photo grid.

**Architecture:** A new Sanity `video` document type (title, vimeoUrl, caption, order) is queried the same way photos are. A small `vimeo.js` lib calls Vimeo's public oEmbed endpoint per video to get a thumbnail and a ready-made `<iframe>` embed snippet, cached in-memory per URL. `VideoGrid`/`VideoLightbox` components parallel the existing `PhotoGrid`/`Lightbox`. `PortfolioPage` gains a Photos/Videos tab switcher and fetches both lists independently.

**Tech Stack:** React 17 (CRA/react-scripts 5), Jest + React Testing Library, Sanity Studio v3 (TypeScript), Vimeo oEmbed API (no API key required).

## Global Constraints

- No new npm dependencies — implement with `fetch` (already available in CRA's target browsers/jsdom test env) and existing React/testing-library packages.
- Follow the spec at `docs/superpowers/specs/2026-09-11-portfolio-videos-design.md`.
- No forced autoplay on the video player (per spec).
- If a video's oEmbed request fails, that tile is omitted from the grid (logged to console), not shown broken.
- Match existing code style: function components, no semicolons-are-present-as-in-existing-files style (existing files DO use semicolons — keep using them), CSS class naming convention `block__element--modifier` as seen in `Portfolio.css`.

---

### Task 1: Sanity `video` document type

**Files:**
- Create: `studio/schemaTypes/video.ts`
- Modify: `studio/schemaTypes/index.ts`

**Interfaces:**
- Produces: a Sanity document type named `video` with fields `title` (string), `vimeoUrl` (string, required), `caption` (text), `order` (number). This is queried by name in Task 3 (`_type == "video"`).

- [ ] **Step 1: Create the schema file**

```typescript
// studio/schemaTypes/video.ts
import { defineField, defineType } from 'sanity';

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'string',
      description: 'Paste the full Vimeo link, e.g. https://vimeo.com/123456789 (works for unlisted links too).',
      validation: (rule) =>
        rule
          .required()
          .regex(/^https:\/\/(www\.)?vimeo\.com\//, {
            name: 'vimeo URL',
            invert: false,
          })
          .error('Must be a vimeo.com URL.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first. Leave empty to sort by date added.',
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'vimeoUrl',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled video',
        subtitle,
      };
    },
  },
});
```

- [ ] **Step 2: Register it in the schema index**

```typescript
// studio/schemaTypes/index.ts
import { photo } from './photo';
import { photoItem } from './photoItem';
import { photoBatch } from './photoBatch';
import { video } from './video';

export const schemaTypes = [photo, photoItem, photoBatch, video];
```

- [ ] **Step 3: Typecheck the studio**

Run: `cd studio && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in Studio**

Run: `cd studio && npm run dev`, open `http://localhost:3333`, confirm a new **Video** document type appears in the left nav, and that creating one without a `vimeoUrl` shows a validation error, while `https://vimeo.com/76979871` (Vimeo's own staff-pick demo video, public) passes validation and can be published.

- [ ] **Step 5: Commit**

```bash
git add studio/schemaTypes/video.ts studio/schemaTypes/index.ts
git commit -m "Add Sanity video document type"
```

---

### Task 2: Vimeo oEmbed lib

**Files:**
- Create: `src/portfolio/lib/vimeo.js`
- Test: `src/portfolio/lib/vimeo.test.js`

**Interfaces:**
- Produces: `fetchVimeoOembed(vimeoUrl: string): Promise<{ thumbnail_url: string, html: string, [key: string]: any }>`. Rejects if the HTTP response is not OK. Caches per `vimeoUrl` (including in-flight requests) so concurrent/duplicate calls only hit the network once; a failed request is not cached (a later call retries). Consumed by `VideoGrid.js` (Task 4) and indirectly by `VideoLightbox.js` (Task 5) via the `html` field passed through `VideoGrid`'s `onSelect`.

- [ ] **Step 1: Write the failing tests**

```javascript
// src/portfolio/lib/vimeo.test.js
import { fetchVimeoOembed } from './vimeo';

const OK_RESPONSE = {
  thumbnail_url: 'https://i.vimeocdn.com/video/thumb.jpg',
  html: '<iframe src="https://player.vimeo.com/video/123"></iframe>',
};

function mockFetchOnce(ok, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('requests the Vimeo oEmbed endpoint with the encoded video URL', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  await fetchVimeoOembed('https://vimeo.com/123456789');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F123456789'
  );
});

test('resolves with the parsed oEmbed JSON on success', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  const result = await fetchVimeoOembed('https://vimeo.com/123456789');

  expect(result).toEqual(OK_RESPONSE);
});

test('caches results so a second call for the same URL does not refetch', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  // Uses a URL not used by other tests in this file — the module-level cache
  // in vimeo.js persists across tests, so reusing a URL would collide.
  await fetchVimeoOembed('https://vimeo.com/555555555');
  await fetchVimeoOembed('https://vimeo.com/555555555');

  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('does not cache a failed request, so a later call retries', async () => {
  mockFetchOnce(false, {});

  await expect(fetchVimeoOembed('https://vimeo.com/999')).rejects.toThrow();

  mockFetchOnce(true, OK_RESPONSE);
  const result = await fetchVimeoOembed('https://vimeo.com/999');

  expect(result).toEqual(OK_RESPONSE);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watchAll=false src/portfolio/lib/vimeo.test.js`
Expected: FAIL — `Cannot find module './vimeo'` (file doesn't exist yet).

- [ ] **Step 3: Implement the lib**

```javascript
// src/portfolio/lib/vimeo.js
const cache = new Map();

export function fetchVimeoOembed(vimeoUrl) {
  if (cache.has(vimeoUrl)) {
    return cache.get(vimeoUrl);
  }

  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`;

  const promise = fetch(oembedUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Vimeo oEmbed request failed with status ${response.status}`);
    }
    return response.json();
  });

  cache.set(vimeoUrl, promise);

  promise.catch(() => {
    cache.delete(vimeoUrl);
  });

  return promise;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watchAll=false src/portfolio/lib/vimeo.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/portfolio/lib/vimeo.js src/portfolio/lib/vimeo.test.js
git commit -m "Add Vimeo oEmbed fetch/cache helper"
```

---

### Task 3: `fetchVideos` in the Sanity lib

**Files:**
- Modify: `src/portfolio/lib/sanity.js`
- Test: `src/portfolio/lib/sanity.test.js` (new file — no existing tests for this module)

**Interfaces:**
- Consumes: existing exported `client` and `isSanityConfigured` from the same file.
- Produces: `fetchVideos(): Promise<Array<{ _id: string, title?: string, vimeoUrl: string, caption?: string }>>`, sorted server-side (GROQ `order()`) by `order` ascending (missing values last) then `_createdAt` descending — same convention as `photo.order`. Returns `[]` immediately if `isSanityConfigured` is false, without calling `client.fetch`. Consumed by `PortfolioPage.js` (Task 6).

- [ ] **Step 1: Write the failing tests**

```javascript
// src/portfolio/lib/sanity.test.js
import { client, isSanityConfigured, fetchVideos } from './sanity';

test('fetchVideos returns [] without calling the client when Sanity is not configured', async () => {
  if (isSanityConfigured) {
    return; // this repo's test env has REACT_APP_SANITY_PROJECT_ID set; skip (see Step 2 note)
  }
  const spy = jest.spyOn(client, 'fetch');
  const result = await fetchVideos();
  expect(result).toEqual([]);
  expect(spy).not.toHaveBeenCalled();
});

test('fetchVideos queries the video document type and returns the client result', async () => {
  const fakeVideos = [
    { _id: 'v1', title: 'Reel', vimeoUrl: 'https://vimeo.com/1', caption: '' },
  ];
  const spy = jest.spyOn(client, 'fetch').mockResolvedValue(fakeVideos);

  const result = await fetchVideos();

  expect(spy).toHaveBeenCalledWith(expect.stringContaining('_type == "video"'));
  expect(result).toEqual(fakeVideos);

  spy.mockRestore();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watchAll=false src/portfolio/lib/sanity.test.js`
Expected: FAIL — `fetchVideos is not a function` (not exported yet). Note: the first test only exercises the "not configured" branch and self-skips in any environment where `REACT_APP_SANITY_PROJECT_ID` is already set (e.g. via `.env`), since `isSanityConfigured` is fixed at module load; the second test covers the always-relevant "client is called correctly" behavior regardless of environment.

- [ ] **Step 3: Implement `fetchVideos`**

```javascript
// src/portfolio/lib/sanity.js
// Add below the existing PHOTOS_QUERY/fetchPhotos code, keeping all existing exports unchanged.

const VIDEOS_QUERY = `*[_type == "video"] | order(coalesce(order, 9999) asc, _createdAt desc) {
  _id,
  title,
  vimeoUrl,
  caption
}`;

export async function fetchVideos() {
  if (!isSanityConfigured) {
    return [];
  }

  return client.fetch(VIDEOS_QUERY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watchAll=false src/portfolio/lib/sanity.test.js`
Expected: PASS (2 tests, or 1 pass + 1 early-return depending on env as noted above).

- [ ] **Step 5: Commit**

```bash
git add src/portfolio/lib/sanity.js src/portfolio/lib/sanity.test.js
git commit -m "Add fetchVideos to Sanity data lib"
```

---

### Task 4: `VideoGrid` component

**Files:**
- Create: `src/portfolio/components/VideoGrid.js`
- Test: `src/portfolio/components/VideoGrid.test.js`
- Modify: `src/portfolio/Portfolio.css` (append video grid styles)

**Interfaces:**
- Consumes: `fetchVimeoOembed(vimeoUrl)` from `../lib/vimeo` (Task 2).
- Produces: `<VideoGrid videos={Array<{_id, title, vimeoUrl, caption}>} onSelect={(videoWithHtml) => void} />`. Calls `onSelect` with `{ ...video, oembedHtml: string }` on tile click. Consumed by `PortfolioPage.js` (Task 6). `onSelect`'s payload shape (`oembedHtml` key) must match what `VideoLightbox.js` (Task 5) expects.

- [ ] **Step 1: Write the failing tests**

```javascript
// src/portfolio/components/VideoGrid.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoGrid from './VideoGrid';
import { fetchVimeoOembed } from '../lib/vimeo';

jest.mock('../lib/vimeo');

const video = {
  _id: 'v1',
  title: 'My Reel',
  vimeoUrl: 'https://vimeo.com/123',
  caption: 'A caption',
};

afterEach(() => {
  jest.resetAllMocks();
});

test('shows the empty state when there are no videos', () => {
  render(<VideoGrid videos={[]} onSelect={() => {}} />);
  expect(screen.getByText(/no videos yet/i)).toBeInTheDocument();
});

test('renders a tile with the fetched thumbnail', async () => {
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="My Reel"></iframe>',
  });

  render(<VideoGrid videos={[video]} onSelect={() => {}} />);

  const img = await screen.findByRole('img');
  expect(img).toHaveAttribute('src', 'https://i.vimeocdn.com/thumb.jpg');
});

test('clicking a tile calls onSelect with the video plus oembedHtml', async () => {
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="My Reel"></iframe>',
  });
  const onSelect = jest.fn();

  render(<VideoGrid videos={[video]} onSelect={onSelect} />);

  const button = await screen.findByRole('button');
  fireEvent.click(button);

  expect(onSelect).toHaveBeenCalledWith({
    ...video,
    oembedHtml: '<iframe title="My Reel"></iframe>',
  });
});

test('omits a tile whose oEmbed request fails, without crashing', async () => {
  fetchVimeoOembed.mockRejectedValue(new Error('boom'));
  jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<VideoGrid videos={[video]} onSelect={() => {}} />);

  await waitFor(() => {
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watchAll=false src/portfolio/components/VideoGrid.test.js`
Expected: FAIL — `Cannot find module './VideoGrid'`.

- [ ] **Step 3: Implement the component**

```javascript
// src/portfolio/components/VideoGrid.js
import { useEffect, useState } from 'react';
import { fetchVimeoOembed } from '../lib/vimeo';

const VideoTile = ({ video, onSelect }) => {
  const [oembed, setOembed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchVimeoOembed(video.vimeoUrl)
      .then((data) => {
        if (!cancelled) {
          setOembed(data);
        }
      })
      .catch((err) => {
        console.error(`Failed to load Vimeo oEmbed for ${video.vimeoUrl}`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [video.vimeoUrl]);

  if (!oembed) {
    return null;
  }

  return (
    <li className="video-grid__item">
      <button
        type="button"
        className="video-grid__button"
        onClick={() => onSelect({ ...video, oembedHtml: oembed.html })}
        aria-label={video.title || 'Play video'}
      >
        <img
          src={oembed.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="video-grid__play" aria-hidden="true" />
      </button>
    </li>
  );
};

const VideoGrid = ({ videos, onSelect }) => {
  if (videos.length === 0) {
    return (
      <p className="gallery-empty">
        No videos yet. In Studio, create a <strong>Video</strong> document with a
        Vimeo link, then publish.
      </p>
    );
  }

  return (
    <ul className="video-grid">
      {videos.map((video) => (
        <VideoTile key={video._id} video={video} onSelect={onSelect} />
      ))}
    </ul>
  );
};

export default VideoGrid;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watchAll=false src/portfolio/components/VideoGrid.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Add grid styles**

Append to `src/portfolio/Portfolio.css`:

```css
.portfolio .video-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.5rem;
}

@media (min-width: 900px) {
  .portfolio .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0.65rem;
  }
}

.portfolio .video-grid__item {
  margin: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #141414;
}

.portfolio .video-grid__button {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.portfolio .video-grid__button:hover {
  opacity: 0.88;
}

.portfolio .video-grid__button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.portfolio .video-grid__button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.portfolio .video-grid__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
}

.portfolio .video-grid__play::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 55%;
  transform: translate(-50%, -50%);
  border-style: solid;
  border-width: 0.55rem 0 0.55rem 0.9rem;
  border-color: transparent transparent transparent #fff;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/portfolio/components/VideoGrid.js src/portfolio/components/VideoGrid.test.js src/portfolio/Portfolio.css
git commit -m "Add VideoGrid component"
```

---

### Task 5: `VideoLightbox` component

**Files:**
- Create: `src/portfolio/components/VideoLightbox.js`
- Test: `src/portfolio/components/VideoLightbox.test.js`
- Modify: `src/portfolio/Portfolio.css` (append video lightbox styles)

**Interfaces:**
- Consumes: nothing beyond React — receives its data as props.
- Produces: `<VideoLightbox video={{ title?, caption?, oembedHtml } | null} onClose={() => void} />`. Renders `null` when `video` is falsy. Renders `video.oembedHtml` via `dangerouslySetInnerHTML`. Consumed by `PortfolioPage.js` (Task 6), mirroring how the existing `Lightbox.js` is used for photos.

- [ ] **Step 1: Write the failing tests**

```javascript
// src/portfolio/components/VideoLightbox.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import VideoLightbox from './VideoLightbox';

const video = {
  title: 'My Reel',
  caption: 'A caption',
  oembedHtml: '<iframe data-testid="vimeo-frame" title="My Reel"></iframe>',
};

afterEach(() => {
  document.body.style.overflow = '';
});

test('renders nothing when video is null', () => {
  const { container } = render(<VideoLightbox video={null} onClose={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders the oEmbed html, title, and caption', () => {
  render(<VideoLightbox video={video} onClose={() => {}} />);

  expect(screen.getByTestId('vimeo-frame')).toBeInTheDocument();
  expect(screen.getByText('My Reel')).toBeInTheDocument();
  expect(screen.getByText('A caption')).toBeInTheDocument();
});

test('pressing Escape calls onClose', () => {
  const onClose = jest.fn();
  render(<VideoLightbox video={video} onClose={onClose} />);

  fireEvent.keyDown(window, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking the overlay calls onClose, clicking the figure does not', () => {
  const onClose = jest.fn();
  render(<VideoLightbox video={video} onClose={onClose} />);

  fireEvent.click(screen.getByTestId('vimeo-frame'));
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('dialog'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watchAll=false src/portfolio/components/VideoLightbox.test.js`
Expected: FAIL — `Cannot find module './VideoLightbox'`.

- [ ] **Step 3: Implement the component**

```javascript
// src/portfolio/components/VideoLightbox.js
import { useEffect, useCallback } from 'react';

const VideoLightbox = ({ video, onClose }) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!video) {
    return null;
  }

  const label = video.title;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label ? `Video: ${label}` : 'Video player'}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <figure
        className="lightbox__figure video-lightbox__figure"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="video-lightbox__player"
          dangerouslySetInnerHTML={{ __html: video.oembedHtml }}
        />
        {(video.title || video.caption) && (
          <figcaption className="lightbox__caption">
            {video.title && <strong>{video.title}</strong>}
            {video.caption && <span>{video.caption}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

export default VideoLightbox;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watchAll=false src/portfolio/components/VideoLightbox.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Add lightbox player styles**

Append to `src/portfolio/Portfolio.css`:

```css
.portfolio .video-lightbox__figure {
  width: min(96vw, 1200px);
}

.portfolio .video-lightbox__player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.portfolio .video-lightbox__player iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/portfolio/components/VideoLightbox.js src/portfolio/components/VideoLightbox.test.js src/portfolio/Portfolio.css
git commit -m "Add VideoLightbox component"
```

---

### Task 6: Wire videos into `PortfolioPage` with tabs

**Files:**
- Modify: `src/pages/PortfolioPage.js`
- Test: `src/pages/PortfolioPage.test.js` (new file — no existing tests for this page)
- Modify: `src/portfolio/Portfolio.css` (append tab styles)

**Interfaces:**
- Consumes: `fetchPhotos`, `fetchVideos`, `isSanityConfigured` from `../portfolio/lib/sanity` (Task 3); `VideoGrid` (Task 4) via `onSelect={(video) => void}`; `VideoLightbox` (Task 5) via `video`/`onClose` props; existing `PhotoGrid`/`Lightbox` unchanged.
- Produces: the `/portfolio` page with a "Photos" / "Videos" tab switcher; default tab is Photos (preserves current behavior for existing visitors/links).

- [ ] **Step 1: Write the failing tests**

```javascript
// src/pages/PortfolioPage.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from './PortfolioPage';
import { fetchPhotos, fetchVideos } from '../portfolio/lib/sanity';
import { fetchVimeoOembed } from '../portfolio/lib/vimeo';

jest.mock('../portfolio/lib/sanity');
jest.mock('../portfolio/lib/vimeo');

function renderPage() {
  return render(
    <MemoryRouter>
      <PortfolioPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

test('defaults to the Photos tab and loads photos', async () => {
  Object.defineProperty(require('../portfolio/lib/sanity'), 'isSanityConfigured', { value: true });
  fetchPhotos.mockResolvedValue([]);
  fetchVideos.mockResolvedValue([]);

  renderPage();

  expect(screen.getByRole('tab', { name: /photos/i })).toHaveAttribute('aria-selected', 'true');
  await waitFor(() => expect(fetchPhotos).toHaveBeenCalled());
});

test('switching to the Videos tab loads and shows videos', async () => {
  Object.defineProperty(require('../portfolio/lib/sanity'), 'isSanityConfigured', { value: true });
  fetchPhotos.mockResolvedValue([]);
  fetchVideos.mockResolvedValue([
    { _id: 'v1', title: 'Reel', vimeoUrl: 'https://vimeo.com/1', caption: '' },
  ]);
  // VideoGrid renders a real VideoTile for this video, which calls
  // fetchVimeoOembed — without a resolved value here it stays an
  // auto-mocked jest.fn() returning undefined, and VideoTile's
  // `.then()` on that throws and crashes the tree.
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="Reel"></iframe>',
  });

  renderPage();

  fireEvent.click(screen.getByRole('tab', { name: /videos/i }));

  await waitFor(() => expect(fetchVideos).toHaveBeenCalled());
  expect(screen.getByRole('tab', { name: /videos/i })).toHaveAttribute('aria-selected', 'true');
});
```

Note: mocking a named boolean export (`isSanityConfigured`) from an ES module requires `jest.mock` plus `Object.defineProperty` as shown, since `jest.mock('../portfolio/lib/sanity')` auto-mocks it as `undefined` by default — the tests above explicitly set it to `true` per-test so both `fetchPhotos`/`fetchVideos` are actually called.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watchAll=false src/pages/PortfolioPage.test.js`
Expected: FAIL — no `role="tab"` elements exist yet (tabs not implemented).

- [ ] **Step 3: Implement the tabbed page**

```javascript
// src/pages/PortfolioPage.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PhotoGrid from "../portfolio/components/PhotoGrid";
import Lightbox from "../portfolio/components/Lightbox";
import VideoGrid from "../portfolio/components/VideoGrid";
import VideoLightbox from "../portfolio/components/VideoLightbox";
import { fetchPhotos, fetchVideos, isSanityConfigured } from "../portfolio/lib/sanity";
import "../portfolio/Portfolio.css";

function useSanityCollection(fetcher) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSanityConfigured) {
        setLoading(false);
        setError("missing-config");
        return;
      }

      try {
        const data = await fetcher();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("fetch-failed");
          setErrorDetail(err?.message || String(err));
          console.error(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return { items, loading, error, errorDetail };
}

function GalleryStatus({ loading, error, errorDetail }) {
  if (loading) {
    return <p className="gallery-status">Loading…</p>;
  }

  if (error === "missing-config") {
    return (
      <p className="gallery-status gallery-status--error">
        Set <code>REACT_APP_SANITY_PROJECT_ID</code> in <code>.env</code> to
        connect Sanity. See <code>studio/README.md</code>.
      </p>
    );
  }

  if (error === "fetch-failed") {
    return (
      <p className="gallery-status gallery-status--error">
        Could not load content. In{" "}
        <a
          href="https://www.sanity.io/manage/project/fnbgcar3/api"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sanity → API → CORS origins
        </a>
        , add this exact origin (credentials <strong>off</strong>):{" "}
        <code>{window.location.origin}</code>. If visitors use both www and
        non-www, add both origins.
        {errorDetail && (
          <>
            <br />
            <small>{errorDetail}</small>
          </>
        )}
        {process.env.NODE_ENV === "development" && (
          <>
            <br />
            <small>After saving CORS, restart npm start.</small>
          </>
        )}
      </p>
    );
  }

  return null;
}

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("photos");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const photos = useSanityCollection(fetchPhotos);
  const videos = useSanityCollection(fetchVideos);

  return (
    <div className="portfolio">
      <header className="portfolio-header">
        <h1>Rakan Shaker</h1>
        <p>Creative</p>
        <Link className="portfolio-header__link" to="/">
          rakanshaker.com
        </Link>
      </header>

      <div className="portfolio-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "photos"}
          className={`portfolio-tabs__button${
            activeTab === "photos" ? " portfolio-tabs__button--active" : ""
          }`}
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "videos"}
          className={`portfolio-tabs__button${
            activeTab === "videos" ? " portfolio-tabs__button--active" : ""
          }`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
      </div>

      <main className="portfolio-main">
        {activeTab === "photos" ? (
          <>
            <GalleryStatus {...photos} />
            {!photos.loading && !photos.error && (
              <PhotoGrid photos={photos.items} onSelect={setSelectedPhoto} />
            )}
          </>
        ) : (
          <>
            <GalleryStatus {...videos} />
            {!videos.loading && !videos.error && (
              <VideoGrid videos={videos.items} onSelect={setSelectedVideo} />
            )}
          </>
        )}
      </main>

      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      <VideoLightbox video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
};

export default PortfolioPage;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watchAll=false src/pages/PortfolioPage.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test suite**

Run: `npm test -- --watchAll=false`
Expected: All tests pass (App.test.js + all new test files from Tasks 2–6).

- [ ] **Step 6: Add tab styles**

Append to `src/portfolio/Portfolio.css`:

```css
.portfolio-tabs {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.portfolio-tabs__button {
  background: none;
  border: none;
  color: #9a9a9a;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.5rem 0.25rem 0.75rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.portfolio-tabs__button:hover {
  color: #ddd;
}

.portfolio-tabs__button--active {
  color: #fff;
  border-bottom-color: #fff;
}
```

- [ ] **Step 7: Manual end-to-end verification**

Run: `npm start`, open `http://localhost:3000/portfolio`.
1. Confirm the page loads on the Photos tab exactly as before.
2. In Sanity Studio (`cd studio && npm run dev`), publish a **Video** document using a Vimeo URL provided by the user for testing.
3. Back on the site, click the Videos tab — confirm the new video's thumbnail appears.
4. Click the thumbnail — confirm the modal opens with a playable Vimeo player, title/caption (if set) shown below it.
5. Confirm Escape and click-outside both close the modal.
6. If the user provides an **unlisted** Vimeo link, repeat steps 2–5 with it to confirm the private hash is handled correctly.

- [ ] **Step 8: Commit**

```bash
git add src/pages/PortfolioPage.js src/pages/PortfolioPage.test.js src/portfolio/Portfolio.css
git commit -m "Add Photos/Videos tabs to the Creative page"
```
