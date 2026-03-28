# Integrating EYESY Web (eyesy_projects) into theingredients.io

This guide is for maintainers of **theingredients.io** (Vercel). It explains how to host the EYESY web visualizer from this repository at a **subpath on the same domain**, for example:

- `https://ingredients.io/video/`
- `https://ingredients.io/video/visualizer`
- `https://ingredients.io/video/clip-stitch`

Adjust the hostname if you use `www` or another subdomain. The path segment used below is **`/video`**; it must match where you deploy the static files and what you use in the build command.

---

## What you are shipping

The web app lives in the **eyesy_projects** repo under **`web-ts/`**. It builds to **static files** (HTML, JS, CSS). No Node server is required in production.

**Source repository:** the `eyesy_projects` project (EYESY modes + TypeScript web client).

---

## 1. Build the subpath bundle (in eyesy_projects)

On a machine with Node.js 18+:

```bash
git clone <eyesy_projects-repo-url> eyesy_projects
cd eyesy_projects/web-ts
npm ci
npm run build:ingredients
```

`build:ingredients` runs Vite with **`--base=/video/`** so asset URLs and in-app routing work under `/video/`.

The output to deploy is everything inside:

```text
eyesy_projects/web-ts/dist/
```

---

## 2. Place files in the theingredients.io project

Copy the **contents** of `web-ts/dist/` into your site so they are served at **`/video/`**.

### If the site uses a `public/` folder (common for Vercel static sites)

Target directory:

```text
theingredients.io/public/video/
```

After copying, you should have at least:

```text
public/video/index.html
public/video/assets/   ← hashed JS/CSS bundles
```

Do **not** nest an extra `dist` folder; `index.html` must be reachable as **`/video/index.html`** (or `/video/` with default document behavior).

### If your framework outputs its own `dist/` or `.vercel/output`

Use the equivalent “public static assets” location your stack documents, as long as the deployed URL structure is still **`/video/...`**.

---

## 3. Vercel: SPA fallback rewrites

The app uses the browser path to choose screens (landing vs visualizer vs clip-stitch). Routes like `/video/visualizer` are **not** separate HTML files. Vercel must serve **`/video/index.html`** for those URLs.

Add or **merge** the following into **`vercel.json`** at the root of the **theingredients.io** repository:

```json
{
  "rewrites": [
    { "source": "/video", "destination": "/video/index.html" },
    { "source": "/video/:path*", "destination": "/video/index.html" }
  ]
}
```

Vercel serves **real files first** (for example `/video/assets/...`), so the rewrite applies when no matching file exists.

If you already have a `rewrites` array, append these two entries to it instead of replacing the whole file.

---

## 4. Verification checklist

After deploy:

| Check | Expected |
|--------|-----------|
| Open `/video/` | Landing page loads; no blank screen |
| Open `/video/visualizer` | Visualizer loads (not 404) |
| Open `/video/clip-stitch` | Clip Stitch loads (not 404) |
| DevTools → Network | JS/CSS requests go to `/video/assets/...` and return 200 |

If the page is blank but `index.html` returns 200, confirm the build was done with **`npm run build:ingredients`** (or `vite build --base=/video/`), not a default build with base `/`.

---

## 5. Updating when eyesy_projects changes

1. Pull latest **eyesy_projects**, run `npm ci` and `npm run build:ingredients` again.
2. Replace the contents of **`public/video/`** (or your chosen deploy folder) with the new **`web-ts/dist/`** contents.
3. Commit and push; Vercel will redeploy.

---

## 6. Optional: keep repos linked without copying by hand

- **Git submodule:** add eyesy_projects under something like `vendor/eyesy_projects`, build in CI, and copy `web-ts/dist/*` into `public/video/` in a deploy script.
- **Monorepo / workspace:** same idea—CI builds `web-ts` and copies `dist` into the static root theingredients uses.

Exact CI steps depend on your theingredients.io repo layout; the invariant is always: **deploy `dist` under `/video/` with base `/video/`**.

---

## 7. Reference (this repo)

| Item | Location |
|------|-----------|
| Web app source | `web-ts/` |
| Subpath production build script | `web-ts/package.json` → `build:ingredients` |
| Broader web deployment context | `docs/WEB_DEPLOYMENT_OPTIONS.md` |

If something in this doc drifts from the repo (script names, paths), treat **eyesy_projects** as the source of truth.
