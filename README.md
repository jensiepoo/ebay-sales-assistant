# eBay Sales Assistant

**Automate the tedious parts of selling on eBay.** Research products, extract specs and images, generate professional listings with AI—all from your terminal.

The most time-consuming part of eBay selling isn't filling in price or shipping—it's the research. Finding official product pages, gathering specs, downloading stock images, writing descriptions. This app does that heavy lifting for you.

## Features

- **Product Research** — Enter a product name, the app searches Google (with DuckDuckGo fallback), shows you candidates to confirm, then scrapes the official product page
- **Auto-Extract Item Specifics** — Brand, model, MPN, UPC, dimensions, weight, color, material—pulled from JSON-LD schema and HTML
- **Stock Image Download** — Official product images saved to `~/Desktop/ebay/[product-name]/`
- **AI Description Generation** — Professional eBay listings using OpenAI, Anthropic Claude, or Google Vertex AI
- **Price Intelligence** — See recent eBay sold listings to price competitively (via eBay Browse API)
- **Research History** — All past research saved locally, browse and reuse anytime
- **Draft Auto-Save** — Never lose work, drafts save every 30 seconds

## How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   SEARCH    │───▶│   CONFIRM   │───▶│  RESEARCH   │───▶│    EDIT     │
│  "Sony XM5" │    │   PRODUCT   │    │  + IMAGES   │    │  + SUBMIT   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │
       ▼                  ▼
  [paste URL]      ["None of these"
   fallback         → paste URL]
```

1. **Search** — Type a product name (e.g., "Sony WH-1000XM5")
2. **Confirm** — Pick the correct product from search results (or paste a URL directly)
3. **Research** — App scrapes the page, extracts specs, downloads images, generates description
4. **Edit & Submit** — Review, tweak, and submit to eBay

## Quick Start

### Prerequisites

- Node.js 18+
- macOS (for Keychain token storage) or modify `src/lib/ebay/auth.ts` for other platforms

### Installation

```bash
git clone https://github.com/jensiepoo/ebay-sales-assistant.git
cd ebay-sales-assistant
npm install
npx playwright install chromium
```

### Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# AI Provider (pick ONE)
OPENAI_API_KEY=sk-...           # Recommended: simplest setup
# ANTHROPIC_API_KEY=sk-ant-...  # Alternative: Claude
# GOOGLE_CLOUD_PROJECT=my-proj  # Alternative: Vertex AI (requires ADC)

# eBay API (optional - only needed for submitting listings)
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=http://localhost:3000/api/ebay/auth
EBAY_SANDBOX=true
```

> **Note:** The app works without eBay credentials—you can research products and generate descriptions without connecting to eBay. Only connect when you're ready to submit listings.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI Providers

The app auto-detects which provider to use based on environment variables:

| Provider | Env Variable | Model |
|----------|-------------|-------|
| OpenAI | `OPENAI_API_KEY` | gpt-4o-mini |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4 |
| Vertex AI | `GOOGLE_CLOUD_PROJECT` | gemini-1.5-flash |

If no AI is configured, descriptions fall back to a template-based generator.

### Adding a Provider

Create `src/lib/ai/providers/[name].ts` implementing the `AIClient` interface:

```typescript
import { AIClient, GenerateDescriptionInput } from "../types";

export class MyClient implements AIClient {
  async generateDescription(input: GenerateDescriptionInput): Promise<string> {
    // Your implementation
  }
}
```

## Getting eBay API Credentials

1. Go to [developer.ebay.com](https://developer.ebay.com)
2. Create an account and application
3. Get your Client ID and Client Secret
4. For development, use Sandbox credentials with `EBAY_SANDBOX=true`
5. For production, get Production credentials and set `EBAY_SANDBOX=false`

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main workflow (search → research → edit)
│   ├── history/              # Research history browser
│   ├── settings/             # Seller defaults
│   └── api/
│       ├── search/           # Google/DDG search via Playwright
│       ├── scrape/           # Product page extraction
│       ├── images/download/  # Save images to ~/Desktop/ebay/
│       ├── ai/describe/      # AI description generation
│       ├── ebay/             # OAuth, listings, sold comps
│       ├── drafts/           # Auto-save/load
│       └── history/          # Research history CRUD
├── components/               # React components
└── lib/
    ├── scraper/
    │   ├── browser.ts        # Singleton Playwright instance
    │   ├── queue.ts          # Mutex (one scrape at a time)
    │   ├── search.ts         # Google → DDG fallback
    │   ├── product.ts        # Orchestrates extraction
    │   └── extractors/       # JSON-LD + HTML parsing
    ├── ai/
    │   ├── providers/        # OpenAI, Anthropic, Vertex
    │   ├── prompt.ts         # Description prompt template
    │   └── types.ts          # AIClient interface
    ├── db/
    │   ├── schema.ts         # SQLite schema (Drizzle)
    │   └── client.ts         # Database connection
    ├── ebay/                 # eBay API client + OAuth
    └── templates/            # Fallback description generator
```

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Runtime | Localhost only | Playwright needs a real browser |
| Scraping | Playwright | Handles JavaScript-heavy product pages |
| Search | Google → DDG fallback | Resilient to blocks |
| Database | SQLite at `~/.ebay-assistant/data.db` | Zero config, portable |
| Token storage | macOS Keychain | Secure native storage |
| AI | Pluggable providers | Use whatever you have |
| Browser reuse | Singleton + mutex | One browser, one scrape at a time |

## Data Storage

- **Database:** `~/.ebay-assistant/data.db` (SQLite, created automatically)
- **Stock images:** `~/Desktop/ebay/[product-name]/stock-1.jpg`, etc.
- **eBay tokens:** macOS Keychain (service: `ebay-sales-assistant`)

## Development

```bash
npm run dev           # Start dev server (webpack mode for native modules)
npm run build         # Production build
npm run lint          # ESLint
npm run db:studio     # Inspect database with Drizzle Studio
```

## Roadmap

- [ ] Batch mode (list multiple items efficiently)
- [ ] Barcode/UPC scanner for instant product lookup
- [ ] Support for Mercari, Facebook Marketplace
- [ ] Mobile companion (take photos on phone, finish on desktop)

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT

---

Built for eBay sellers who value their time.
