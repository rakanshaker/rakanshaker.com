# Sanity Studio — Photography

CMS for the photography portfolio.

- **Photo upload (multiple)** — drag many files onto the Photos field, or multi-select in Upload; fill alt text on each image after.
- **Photo** — one image per document (fine for a single shot).

## Quick start

```bash
cp .env.example .env
# Edit .env with your SANITY_STUDIO_PROJECT_ID

npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333).

## Deploy studio (optional)

```bash
npm run deploy
```

Hosts the studio on a `*.sanity.studio` URL, or configure a custom subdomain in Sanity manage.

## Portfolio site

The gallery lives in the **root** Create React App at `/portfolio` (and on `portfolio.rakanshaker.com` when that subdomain points to the same Vercel project). Use the same project ID in the repo root `.env`:

```env
REACT_APP_SANITY_PROJECT_ID=fnbgcar3
REACT_APP_SANITY_DATASET=production
```

Add CORS origins (Sanity manage → API → CORS): `http://localhost:3000`, `https://rakanshaker.com`, `https://portfolio.rakanshaker.com`. Allow credentials: **off** for public read.

Local dev also proxies API via `src/setupProxy.js` so the gallery works even before CORS is set — **restart `npm start`** after pulling changes.
