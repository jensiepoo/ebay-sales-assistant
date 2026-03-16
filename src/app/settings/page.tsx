"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, User, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Settings {
  seller_username: string;
  seller_rating: string;
  seller_location: string;
  default_return_policy: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    seller_username: "jensiepoo72",
    seller_rating: "100",
    seller_location: "New York, US",
    default_return_policy: "No returns",
  });
  const [ebayConnected, setEbayConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          setEbayConnected(data.ebayConnected);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const connectEbay = () => {
    window.location.href = "/api/ebay/auth";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your seller profile and defaults
          </p>
        </div>
      </div>

      {/* eBay Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">eBay Connection</CardTitle>
          <CardDescription>
            Connect your eBay account to create listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ebayConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Your eBay account is linked
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect to create listings on eBay
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button
              variant={ebayConnected ? "outline" : "default"}
              onClick={connectEbay}
            >
              {ebayConnected ? "Reconnect" : "Connect eBay"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seller Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Seller Profile
          </CardTitle>
          <CardDescription>
            Your seller information displayed on listings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={settings.seller_username}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, seller_username: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Rating (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.seller_rating}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, seller_rating: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                value={settings.seller_location}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, seller_location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Return Policy</label>
              <Input
                value={settings.default_return_policy}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    default_return_policy: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saved ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </>
        )}
      </Button>
    </div>
  );
}
