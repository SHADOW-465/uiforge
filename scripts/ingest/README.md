# UIForge Ingestion Pipeline

This pipeline semi-automates collection of premium UI patterns from high-quality sources (shadcn/ui, Flowbite, HyperUI) and inserts them into Supabase via Prisma.

## What It Does

1. Scans local source folders for components
2. Generates previews (HTML sources via Playwright, React via a Next preview harness)
3. Uses an LLM to generate tags + prompt fragments
4. Applies quality + dedupe filters (low-res, low-contrast, redundant layout)
5. Inserts components, variants, code snippets, and tags into the database

## Requirements

- Node.js + npm
- Supabase database access configured in `.env`
- API keys in `.env` for inference
- Playwright installed

## Setup

Add the following to `.env` (values not shown here):

```
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
ANTHROPIC_API_KEY=...
```

Install Playwright browsers:

```
node ./node_modules/playwright/install.js
```

## Sources Layout

Place sources under `sources/`:

```
sources/
  shadcn/
  flowbite/
  hyperui/
```

## Usage

Run from repo root. Each source is a local path.

```
# Dry run
tsx scripts/ingest/index.ts --source=flowbite --path=sources/flowbite --limit=25 --dry-run

# Ingest Flowbite (HTML + screenshots)
tsx scripts/ingest/index.ts --source=flowbite --path=sources/flowbite

# Ingest HyperUI (HTML + screenshots)
tsx scripts/ingest/index.ts --source=hyperui --path=sources/hyperui

# Ingest shadcn/ui (React components)
tsx scripts/ingest/index.ts --source=shadcn --path=sources/shadcn --react-previews
```

## React preview harness

When `--react-previews` is enabled, a temporary Next route renders each component at:

```
http://localhost:4100/__preview
```

The harness auto-starts a Next dev server on port 4100 when needed.

## Notes

- HTML sources get preview screenshots stored in `public/previews/{source}/...`
- React sources can be previewed by enabling `--react-previews`
- Quality filters live in `scripts/ingest/ingest.config.json`

## Model overrides

```
--provider=groq --model=llama-3.1-8b-instant
--provider=openrouter --model=meta-llama/llama-3.1-8b-instruct:free
--provider=anthropic --model=claude-3-5-sonnet-latest
```
