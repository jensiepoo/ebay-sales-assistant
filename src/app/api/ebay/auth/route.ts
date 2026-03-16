import { NextResponse } from "next/server";
import { getAuthUrl, exchangeCodeForTokens } from "@/lib/ebay/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // If no code, redirect to eBay auth
  if (!code) {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  }

  // Exchange code for tokens
  try {
    await exchangeCodeForTokens(code);
    // Redirect back to app with success
    return NextResponse.redirect(new URL("/?connected=true", request.url));
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL("/?error=auth_failed", request.url)
    );
  }
}
