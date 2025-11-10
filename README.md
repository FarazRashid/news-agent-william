# william-news-agent

A lightweight agent for fetching, processing, and summarizing news articles. Designed for automation, extensibility, and integration with downstream workflows (CLI, HTTP API, or message queues).

## Features
- Fetch articles from RSS feeds and news APIs
- Extract and clean article text
- Summarize articles using pluggable summarizers
- Persist metadata and summaries
- CLI and programmatic usage
- Configurable feed and pipeline definitions

## Requirements
- Node.js >= 16 (or specify language/runtime used)
- Network access for feeds/APIs
- Optional: API keys for paid news sources or NLP providers

## Quickstart

1. Clone the repo
```bash
git clone https://github.com/Entropik-Labs/william-news-agent.git
cd william-news-agent
```

2. Install dependencies
```bash
# Node example
npm install
```

3. Configure feeds and API keys
- Create a config file (examples: `config.example.json` → `config.json`)
- Set RSS/HTTP feed URLs, storage path, and any provider credentials

4. Run the agent
```bash
# CLI example
npm run dev
```

## Usage examples

- Run single fetch-and-summarize job:
```bash
node ./bin/agent.js --feed feeds/tech-rss.xml --limit 10
```


## Configuration
- config.json keys:
    - feeds: list of feed URLs
    - storage: path for DB/files
    - summarizer: provider and options
    - schedule: cron expression for periodic runs

Provide `config.example.json` as template.

## Development
- Project layout
    - bin/ — CLI entrypoints
    - src/ — core pipeline, fetchers, parsers, summarizers
    - tests/ — unit and integration tests
    - config/ — example configs and feeds

- Run tests
```bash
npm test
```

- Lint and format
```bash
npm run lint
npm run format
```

## Contributing
- Open issues for bugs and feature requests
- Create feature branches and submit pull requests
- Follow code style and include tests for new behavior

## License
Specify license in `LICENSE` (e.g., MIT).

## Acknowledgements
List any third-party libraries, APIs, or datasets used in the project.

## Web app (Next.js) and Supabase integration

This repository also includes a Next.js UI (app router) that displays news articles. It connects to a Supabase table `public.articles`.

Environment variables (in `.env`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Client usage:

- The UI loads latest rows from `public.articles` on mount via the anon key.
- Rows are mapped to UI types in `lib/articles.ts`.
- Provider: `lib/news-context.tsx` supplies articles, filters, and a `refetch()` method.
- If the table is empty or fetching fails, the UI falls back to local sample content.

Dynamic filters:

- Categories and source domains are derived from the database rows at runtime (no hard-coded lists).
- Time filters operate on `published_at` (falling back to `created_at` when `published_at` is null).
- The category chips in the feed header and sidebar reflect only categories present in the current dataset.


