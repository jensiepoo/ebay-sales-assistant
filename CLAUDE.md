# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev:webpack   # Development server (use this - native modules require webpack)
npm run build         # Production build
npm run lint          # ESLint
npm run db:studio     # Drizzle Studio for database inspection
```

**Important:** Use `dev:webpack` not `dev`. The app uses native Node modules (keytar, better-sqlite3, playwright) that don't work with Turbopack.

## Architecture

### Core Workflow
The app follows a linear stage-based flow in `src/app/page.tsx`:
```
search → candidates → url-paste → researching → results → editing → success
```
Users search for products, confirm the correct one, research extracts data, then they edit and submit to eBay.

### Scraper System (`src/lib/scraper/`)
- **browser.ts**: Singleton Playwright browser instance, reused across requests
- **queue.ts**: Mutex queue ensuring one scrape runs at a time (prevents resource exhaustion)
- **search.ts**: Google search with DuckDuckGo fallback chain
- **product.ts**: Orchestrates extraction, merging JSON-LD and HTML fallback data
- **extractors/**: JSON-LD schema.org parsing (primary) and HTML table/list parsing (fallback)

### Data Storage
- **SQLite database**: `~/.ebay-assistant/data.db` (created automatically)
- **Schema**: `src/lib/db/schema.ts` - research_history, drafts, settings, price_comps tables
- **eBay tokens**: Stored in macOS Keychain via keytar (service: "ebay-sales-assistant")

### eBay Integration (`src/lib/ebay/`)
- OAuth2 flow with token refresh
- Browse API for sold listing comps (price intelligence)
- Inventory API for creating listings
- Sandbox mode controlled by `EBAY_SANDBOX` env var

### AI Provider System (`src/lib/ai/`)
Extensible AI integration for description generation. Auto-detects provider based on env vars:
- `ANTHROPIC_API_KEY` → Anthropic Claude
- `GOOGLE_VERTEX_CREDENTIALS` → Vertex AI (Gemini) - paste full service account JSON
- `OPENAI_API_KEY` → OpenAI

Adding a new provider: create `src/lib/ai/providers/[name].ts` implementing `AIClient` interface.

### Description Generation (`src/lib/templates/description.ts`)
Template-based fallback when no AI configured. Generates eBay listings in a specific style:
1. Title line with brand/model/color
2. Opening paragraph
3. Bullet-point product details
4. Features section
5. Condition (user-provided)
6. MSRP if known
7. "100% Seller Rating! Happy Shopping!" signature

### Key Patterns
- API routes handle all server-side operations (scraping, database, eBay API)
- Stock images download to `~/Desktop/ebay/[sanitized-product-name]/`
- Drafts auto-save every 30 seconds to SQLite
- All scraper operations go through the mutex queue to prevent concurrent browser instances
