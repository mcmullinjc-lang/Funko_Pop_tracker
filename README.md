# Funko Pop Checklist

A simple, no-build web app for tracking a Funko Pop collection: mark pops as owned or missing, add photos, tags (Chase, Store Exclusive, etc.), and organize everything into folders.

## Files

- `index.html` — page structure
- `style.css` — all styling (pastel theme, responsive/mobile layout)
- `script.js` — app logic (storage, rendering, folders, tags, photos)

## Running it

No build step needed. Just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

Or with GitHub Pages: push this repo, then enable Pages in the repo settings (Settings → Pages → Deploy from branch → `main` / root).

## Data storage

Everything (your pop list and folders) is saved in the browser's `localStorage` — nothing is sent to a server. Data is per-browser, so it won't sync across devices unless you extend it with a backend.
