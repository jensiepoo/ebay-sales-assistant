export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = "ScraperError";
  }
}

export class SearchBlockedError extends ScraperError {
  constructor(message = "Search blocked by CAPTCHA or rate limit") {
    super(message, "SEARCH_BLOCKED", true);
    this.name = "SearchBlockedError";
  }
}

export class PageLoadError extends ScraperError {
  constructor(url: string) {
    super(`Failed to load page: ${url}`, "PAGE_LOAD_ERROR", true);
    this.name = "PageLoadError";
  }
}

export class ExtractionError extends ScraperError {
  constructor(message: string) {
    super(message, "EXTRACTION_ERROR", true);
    this.name = "ExtractionError";
  }
}

export class EbayAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EbayAuthError";
  }
}

export class EbayApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errors?: Array<{ errorId: number; message: string }>
  ) {
    super(message);
    this.name = "EbayApiError";
  }
}

export function isRecoverableError(error: unknown): boolean {
  if (error instanceof ScraperError) {
    return error.recoverable;
  }
  return false;
}
