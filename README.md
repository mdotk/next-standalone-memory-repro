# Next.js standalone memory repro

This is a minimal public repro app for investigating unbounded memory growth in:

- `next@16.2.2`
- `output: "standalone"`
- `cacheComponents: true`

The app intentionally does only five things:

1. render a cached dynamic page at `/:slug`
2. serve a cached API route at `/api/payload/:slug`
3. fetch its synthetic data through an internal streamed route at `/api/source/:slug`
4. expose live process memory at `/api/health`
5. generate high-cardinality traffic via `scripts/load.mjs`

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run in standalone mode

```bash
npm run start:standalone
```

The helper script copies `.next/static` into `.next/standalone/.next/static` and
then starts `server.js`.

## Generate load

Run the load generator against the running app:

```bash
BASE_URL=http://127.0.0.1:3000 npm run load
```

Optional knobs:

```bash
BASE_URL=http://127.0.0.1:3000 \
DURATION_MS=300000 \
CONCURRENCY=24 \
PAGE_WEIGHT_KB=256 \
API_WEIGHT_KB=256 \
MIX=page,api,page,page \
npm run load
```

Useful extra knob:

```bash
MAX_LOGGED_FAILURES=20
```

This caps noisy request error logs once the server starts failing.

## Observe memory

Check the health endpoint periodically:

```bash
curl http://127.0.0.1:3000/api/health
```

Useful fields:

- `memory.rss`
- `memory.heapUsed`
- `memory.external`
- `memory.arrayBuffers`

## Known reproducing standalone workload

This repo is intended to reproduce a rapid memory blow-up on the standalone
server, not just a temporary spike.

After `npm run build`, start the standalone server:

```bash
PORT=3025 npm run start:standalone
```

Then run this load from another shell:

```bash
BASE_URL=http://127.0.0.1:3025 \
DURATION_MS=180000 \
CONCURRENCY=64 \
PAGE_WEIGHT_KB=2048 \
API_WEIGHT_KB=2048 \
MIX=page,api,page,page \
MAX_LOGGED_FAILURES=20 \
npm run load
```

During one local run on `next@16.2.2`:

- baseline was about `95 MB rss`
- after `~28s`, memory reached about `1.58 GB rss / 589 MB arrayBuffers`
- after `~38s`, memory reached about `2.36 GB rss / 1.04 GB arrayBuffers`
- after `~62s`, memory reached about `2.42 GB rss / 1.95 GB arrayBuffers`
- after `~180s`, memory reached about `3.43 GB rss / 4.31 GB arrayBuffers`
- the process then exited with `FATAL ERROR: Ineffective mark-compacts near heap limit`

In the failing run, the load generator started receiving:

- `ECONNRESET`
- `UND_ERR_SOCKET`
- `ECONNREFUSED`

after the standalone server destabilized and died.

## Why this repo exists

This is not intended to mirror any private production app. It exists to isolate a
small set of conditions that appear relevant to the reported issue:

- standalone server output
- Cache Components / `"use cache"`
- cached internal server-side `fetch()` of streamed JSON responses
- many unique request paths over time
- repeated page and API responses flowing through the Next.js response pipeline
