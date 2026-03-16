import type { Config } from "drizzle-kit";
import { join } from "path";
import { homedir } from "os";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: join(homedir(), ".ebay-assistant", "data.db"),
  },
} satisfies Config;
