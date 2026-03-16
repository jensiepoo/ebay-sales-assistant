import { chromium, Browser, BrowserContext, Page } from "playwright";

let browserInstance: Browser | null = null;
let contextInstance: BrowserContext | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
  }
  return browserInstance;
}

export async function getContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  if (!contextInstance) {
    contextInstance = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
    });
  }
  return contextInstance;
}

export async function getPage(): Promise<Page> {
  const context = await getContext();
  return context.newPage();
}

export async function closeBrowser(): Promise<void> {
  if (contextInstance) {
    await contextInstance.close();
    contextInstance = null;
  }
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Clean up on process exit
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close();
  }
});
