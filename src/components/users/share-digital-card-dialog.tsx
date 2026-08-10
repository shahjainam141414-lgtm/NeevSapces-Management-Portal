"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { getDigitalCardByProfileId } from "@/app/actions/digital-cards";
import { getCardPublicUrl } from "@/lib/digital-cards";
import type { AdminProfile } from "@/lib/admin-profiles";

type Props = {
  user: AdminProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareDigitalCardDialog({ user, open, onOpenChange }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);
    setCopied(false);
    void getDigitalCardByProfileId(user.id).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.card) {
        setError("No digital card yet. Open Edit digital card and save once.");
        return;
      }
      if (result.card.status !== "active") {
        setError("Card is inactive. Activate it under Edit digital card to share.");
      }
      setUrl(getCardPublicUrl(result.card.slug));
    });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy. Select the link and copy manually.");
    }
  };

  const waHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        `Connect with ${user?.name ?? "our advisor"} at Neev Spaces: ${url}`,
      )}`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[var(--brand)]" />
            Share digital card
          </DialogTitle>
          <DialogDescription>
            Share {user?.name ?? "this advisor"}&apos;s public visiting card.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            {error && <AlertBanner variant="warning">{error}</AlertBanner>}
            {url && (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="break-all text-sm font-medium text-slate-800">{url}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => void copyLink()}
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  <Button type="button" className="flex-1" asChild>
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
