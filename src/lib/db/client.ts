import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DATA_DIR = join(homedir(), ".ebay-assistant");
const DB_PATH = join(DATA_DIR, "data.db");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS research_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    mpn TEXT,
    upc TEXT,
    description TEXT,
    features TEXT,
    specifications TEXT,
    images TEXT,
    source_url TEXT,
    raw_json_ld TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id INTEGER REFERENCES research_history(id),
    title TEXT,
    description TEXT,
    price REAL,
    condition TEXT,
    shipping_policy TEXT,
    return_policy TEXT,
    selected_images TEXT,
    user_photo_paths TEXT,
    category TEXT,
    item_specifics TEXT,
    status TEXT DEFAULT 'draft',
    ebay_listing_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS price_comps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id INTEGER REFERENCES research_history(id),
    title TEXT NOT NULL,
    price REAL NOT NULL,
    condition TEXT,
    sold_date INTEGER,
    listing_url TEXT,
    image_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// Insert default settings if not exists
const defaultSettings = [
  { key: "seller_username", value: "jensiepoo72" },
  { key: "seller_rating", value: "100" },
  { key: "seller_location", value: "New York, US" },
  { key: "default_return_policy", value: "No returns" },
];

const insertSetting = sqlite.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);

for (const setting of defaultSettings) {
  insertSetting.run(setting.key, setting.value);
}

export { DATA_DIR, DB_PATH };
