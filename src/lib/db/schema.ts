import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const researchHistory = sqliteTable("research_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  model: text("model"),
  mpn: text("mpn"),
  upc: text("upc"),
  description: text("description"),
  features: text("features"), // JSON array
  specifications: text("specifications"), // JSON object
  images: text("images"), // JSON array of URLs
  sourceUrl: text("source_url"),
  rawJsonLd: text("raw_json_ld"), // For debugging
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const drafts = sqliteTable("drafts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  researchId: integer("research_id").references(() => researchHistory.id),
  title: text("title"),
  description: text("description"),
  price: real("price"),
  condition: text("condition"),
  shippingPolicy: text("shipping_policy"),
  returnPolicy: text("return_policy"),
  selectedImages: text("selected_images"), // JSON array
  userPhotoPaths: text("user_photo_paths"), // JSON array
  category: text("category"),
  itemSpecifics: text("item_specifics"), // JSON object
  status: text("status").default("draft"), // draft, submitted
  ebayListingId: text("ebay_listing_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const priceComps = sqliteTable("price_comps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  researchId: integer("research_id").references(() => researchHistory.id),
  title: text("title").notNull(),
  price: real("price").notNull(),
  condition: text("condition"),
  soldDate: integer("sold_date", { mode: "timestamp" }),
  listingUrl: text("listing_url"),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Research = typeof researchHistory.$inferSelect;
export type NewResearch = typeof researchHistory.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type PriceComp = typeof priceComps.$inferSelect;
