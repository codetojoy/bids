# Deploying Bids

The app is a fully static site: `npm run build` (adapter-static) prerenders every route into
`build/` — plain HTML, JS, CSS, fonts, and a service worker, with no server code and no
runtime network calls. Any static host works, and there are no environment variables, API
keys, or server runtime involved anywhere.

The one thing to get right is the **base path**, because a default GitHub Pages project site
serves from a subpath (`https://codetojoy.github.io/bids/`), not a domain root.

## Option A (current default): GitHub Pages project site, at the `/bids` subpath

Everything base-sensitive is already parameterized:

- `vite.config.ts` reads `BASE_PATH` and passes it to SvelteKit's `paths.base` (defaults to
  `''`, so `npm run dev` stays at `/`).
- Internal links use `base` from `$app/paths`.
- `@font-face` URLs in `src/app.html` use `%sveltekit.assets%`.
- `static/manifest.webmanifest` is subpath-relative (`start_url: "."`, `scope: "./"`).
- The service worker's precache entry and offline shell fallback are prefixed with `base`.

So a subpath deploy is just:

```sh
npm run deploy:gh-pages   # BASE_PATH=/bids vite build, then publish build/ to gh-pages
```

`static/.nojekyll` ships in the build, which keeps GitHub Pages from dropping SvelteKit's
underscore-prefixed `_app/` directory when publishing from a branch.

Or via GitHub Actions (*Settings → Pages → Source: "GitHub Actions"*). The CI Node version
must satisfy the `engines` range in `package.json` (`^20.19 || ^22.12 || >=24`) — the repo sets
`engine-strict`, so a mismatch fails the build.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build:gh-pages
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Option B: a custom domain (root URL)

SPEC §6 budgets ~$15/year for a domain. Once there is one, add a `static/CNAME` file
containing the bare domain and set it under *Settings → Pages → Custom domain*; GitHub
provisions the HTTPS the service worker requires. Then build with the plain `npm run build`
(no `BASE_PATH`), since the site serves from `/`.

There is no `CNAME` file today — no domain has been registered yet.

## Other static hosts

The same `build/` directory deploys unchanged to any host serving from the root of its own
(sub)domain: Cloudflare Pages, Netlify, Vercel, or `npx serve build` on anything self-hosted.
For the privacy goals in SPEC §1, prefer a host that doesn't inject analytics scripts (GitHub
Pages and Cloudflare Pages don't).

## Verifying a build

```sh
npm run build && npm run preview   # http://localhost:4173
```

Check DevTools → Application → "Service workers" and "Manifest", then reload with "Offline"
toggled: the app should still load.
