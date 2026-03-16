import keytar from "keytar";
import { EbayTokens } from "./types";

const SERVICE_NAME = "ebay-sales-assistant";
const ACCOUNT_NAME = "ebay-oauth";

const EBAY_AUTH_URL = process.env.EBAY_SANDBOX === "true"
  ? "https://auth.sandbox.ebay.com/oauth2/authorize"
  : "https://auth.ebay.com/oauth2/authorize";

const EBAY_TOKEN_URL = process.env.EBAY_SANDBOX === "true"
  ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
  : "https://api.ebay.com/identity/v1/oauth2/token";

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
].join(" ");

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    redirect_uri: process.env.EBAY_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES,
  });

  return `${EBAY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<EbayTokens> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  const tokens: EbayTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  await saveTokens(tokens);
  return tokens;
}

export async function refreshTokens(refreshToken: string): Promise<EbayTokens> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  const tokens: EbayTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  await saveTokens(tokens);
  return tokens;
}

export async function saveTokens(tokens: EbayTokens): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));
}

export async function getTokens(): Promise<EbayTokens | null> {
  const stored = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as EbayTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  // Check if token is expired or will expire in the next minute
  if (tokens.expiresAt < Date.now() + 60000) {
    try {
      const refreshed = await refreshTokens(tokens.refreshToken);
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return tokens.accessToken;
}
