# Spellbook – D&D 5e

A mobile-first static web app for browsing D&D 5e SRD spells. Built with vanilla HTML, CSS, and JavaScript (Vite).

**My Spells** is the default landing page. Edit `src/my-spells.js` and list the spell slugs you want (e.g. `fireball`, `magic-missile`, `shield`). Slugs are the spell’s URL key (lowercase, hyphenated name from the SRD).

## Setup

```bash
npm install
npm run fetch-spells   # Fetches SRD spells from Open5e API into public/spells.json
```

## Dev Container

Open this folder in a dev container (VS Code/Cursor: **Dev Containers: Reopen in Container**). The container uses Node 18, runs `npm install` and `npm run fetch-spells` on first create, and forwards port 5173 for the Vite dev server.

## Scripts

- **`npm run dev`** – Start dev server
- **`npm run build`** – Fetch spells (if needed) and build for production (output in `dist/`)
- **`npm run preview`** – Preview production build locally
- **`npm run fetch-spells`** – Update `public/spells.json` from the Open5e API (SRD 5.1)

## Publish as a static website

1. **Build** the site (everything goes into `dist/`):
   ```bash
   npm run build
   ```
2. **Upload** the contents of the `dist/` folder to any static host. The app uses hash routing (`#my-spells`, `#spells`, etc.), so no server config is required.

### Option A: GitHub Pages

- **From a branch:** Push the built files to a branch (e.g. `gh-pages`) and set that branch as the source in the repo’s **Settings → Pages**.
- **From Actions (recommended):** Create `.github/workflows/deploy.yml` so every push builds and deploys. Example:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: group:pages
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Then in the repo **Settings → Pages**, set **Source** to “GitHub Actions”.

### Option B: Netlify

- **Drag and drop:** Run `npm run build`, then drag the `dist` folder into [Netlify Drop](https://app.netlify.com/drop).
- **From Git:** Connect the repo; set **Build command** to `npm run build` and **Publish directory** to `dist`.

### Option C: Vercel

- Connect the repo at [vercel.com](https://vercel.com). Use **Framework Preset**: Vite; **Build Command**: `npm run build`; **Output Directory**: `dist`.

### Option D: Any static host

Upload the contents of `dist/` to your host (e.g. S3, Cloudflare Pages, your own server). No rewrite rules are needed because the app uses hash-based routing.

## Legal

Spell data and rules are from the D&D 5e System Reference Document (SRD) under the Open Gaming License 1.0a. See the **Sources** page in the app for attribution. This project is not affiliated with Wizards of the Coast.
