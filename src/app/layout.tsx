import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Package, History, Settings } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eBay Sales Assistant",
  description: "Research products and create eBay listings faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-5 w-5" />
              eBay Sales Assistant
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/history"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <History className="h-4 w-4" />
                History
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
