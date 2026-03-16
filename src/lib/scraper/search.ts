import { Page } from "playwright";
import { getPage } from "./browser";
import { scrapeQueue } from "./queue";
import { SearchBlockedError } from "../utils/errors";

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
}

export async function searchProducts(
  query: string
): Promise<{ results: SearchResult[]; source: "google" | "duckduckgo" }> {
  return scrapeQueue.add(async () => {
    // Try Google first
    try {
      const results = await searchGoogle(query);
      if (results.length > 0) {
        return { results, source: "google" as const };
      }
    } catch (error) {
      console.log("Google search failed, falling back to DuckDuckGo:", error);
    }

    // Fallback to DuckDuckGo
    const results = await searchDuckDuckGo(query);
    return { results, source: "duckduckgo" as const };
  });
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  console.log("[Scraper] Getting browser page...");
  const page = await getPage();
  console.log("[Scraper] Browser page ready");

  try {
    // Add "official site" or "product" to improve results
    const searchQuery = `${query} official site`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10`;

    console.log(`[Scraper] Navigating to Google: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log("[Scraper] Page loaded");

    // Check for CAPTCHA
    const captcha = await page.$('form[action*="captcha"], #captcha');
    if (captcha) {
      throw new SearchBlockedError("Google CAPTCHA detected");
    }

    // Wait for results
    await page
      .waitForSelector("#search", { timeout: 5000 })
      .catch(() => {});

    const results = await page.$$eval("#search .g", (elements) => {
      return elements
        .map((el) => {
          const titleEl = el.querySelector("h3");
          const linkEl = el.querySelector("a");
          const snippetEl = el.querySelector('[data-sncf], .VwiC3b');

          if (!titleEl || !linkEl) return null;

          const href = linkEl.getAttribute("href");
          if (!href || href.startsWith("/search")) return null;

          return {
            title: titleEl.textContent || "",
            url: href,
            snippet: snippetEl?.textContent || undefined,
          };
        })
        .filter(Boolean) as SearchResult[];
    });

    return results.slice(0, 8);
  } finally {
    await page.close();
  }
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const page = await getPage();

  try {
    const searchQuery = `${query} official`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const results = await page.$$eval(".result", (elements) => {
      return elements
        .map((el) => {
          const titleEl = el.querySelector(".result__title a");
          const snippetEl = el.querySelector(".result__snippet");

          if (!titleEl) return null;

          const href = titleEl.getAttribute("href");
          if (!href) return null;

          // DuckDuckGo uses redirect URLs, extract the actual URL
          let actualUrl = href;
          const uddgMatch = href.match(/uddg=([^&]+)/);
          if (uddgMatch) {
            actualUrl = decodeURIComponent(uddgMatch[1]);
          }

          return {
            title: titleEl.textContent?.trim() || "",
            url: actualUrl,
            snippet: snippetEl?.textContent?.trim() || undefined,
          };
        })
        .filter(Boolean) as SearchResult[];
    });

    return results.slice(0, 8);
  } finally {
    await page.close();
  }
}
