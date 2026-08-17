"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/alert-banner";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSiteDetails,
  saveSiteDetails,
} from "@/lib/site-details-api";
import { DEFAULT_SITE_DETAILS } from "@/lib/site-details";

export function SettingsPageContent() {
  const [phone, setPhone] = useState(DEFAULT_SITE_DETAILS.phone_display);
  const [email, setEmail] = useState(DEFAULT_SITE_DETAILS.email);
  const [address, setAddress] = useState(DEFAULT_SITE_DETAILS.address);
  const [savedPhone, setSavedPhone] = useState(DEFAULT_SITE_DETAILS.phone_display);
  const [savedEmail, setSavedEmail] = useState(DEFAULT_SITE_DETAILS.email);
  const [savedAddress, setSavedAddress] = useState(DEFAULT_SITE_DETAILS.address);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getSiteDetails();
      setPhone(row.phone_display);
      setEmail(row.email);
      setAddress(row.address);
      setSavedPhone(row.phone_display);
      setSavedEmail(row.email);
      setSavedAddress(row.address);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load site details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty =
    phone.trim() !== savedPhone ||
    email.trim() !== savedEmail ||
    address.trim() !== savedAddress;

  const handleSave = async () => {
    if (!phone.trim() || !email.trim() || !address.trim()) {
      setError("Phone, email, and address are all required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const row = await saveSiteDetails({
        phone_display: phone,
        email,
        address,
      });
      setPhone(row.phone_display);
      setEmail(row.email);
      setAddress(row.address);
      setSavedPhone(row.phone_display);
      setSavedEmail(row.email);
      setSavedAddress(row.address);
      setMessage("Contact details updated. They now show on the website.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save site details.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-[380px]:space-y-6">
      <PageHeader
        eyebrow="Website"
        title="Settings (Details)"
        description="Phone, email, and office address shown on the public site. The phone number is used for Call and WhatsApp everywhere."
        actions={
          <Button
            className="w-full gap-2 min-[380px]:w-auto"
            loading={saving}
            disabled={!dirty || loading}
            onClick={() => void handleSave()}
          >
            {!saving && <Check className="size-4" />}
            {saving ? "Saving…" : "Save details"}
          </Button>
        }
      />

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {message ? <AlertBanner variant="success">{message}</AlertBanner> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-6">
        <Card className="overflow-hidden border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.05)]">
          <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/40">
            <CardTitle className="text-base text-[#16233f]">
              Contact details
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              These three fields update the header, footer, and contact page.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 p-4 min-[380px]:p-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="site-phone">Phone / WhatsApp</Label>
                  <Input
                    id="site-phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setMessage(null);
                    }}
                    placeholder={DEFAULT_SITE_DETAILS.phone_display}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-email">Email</Label>
                  <Input
                    id="site-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMessage(null);
                    }}
                    placeholder={DEFAULT_SITE_DETAILS.email}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-address">Address</Label>
                  <Textarea
                    id="site-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setMessage(null);
                    }}
                    placeholder={DEFAULT_SITE_DETAILS.address}
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.05)]">
          <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/40">
            <CardTitle className="text-base text-[#16233f]">
              Currently live
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 min-[380px]:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#16233f]/8 text-[#16233f]">
                <Phone className="size-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Phone / WhatsApp
                </p>
                <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
                  {savedPhone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#16233f]/8 text-[#16233f]">
                <Mail className="size-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
                  {savedEmail}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#16233f]/8 text-[#16233f]">
                <MapPin className="size-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Address
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
                  {savedAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
