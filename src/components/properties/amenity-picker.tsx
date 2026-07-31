"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/alert-banner";
import { AmenityIcon } from "@/components/customization/amenity-icon";
import { createAmenity } from "@/lib/amenities-api";
import type { Amenity } from "@/lib/amenities";

type AmenityPickerProps = {
  amenities: Amenity[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onAmenitiesChange: (amenities: Amenity[]) => void;
};

export function AmenityPicker({
  amenities,
  selectedIds,
  onSelectedChange,
  onAmenitiesChange,
}: AmenityPickerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedAmenities = useMemo(
    () =>
      [...amenities].sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
        return a.title.localeCompare(b.title);
      }),
    [amenities],
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedChange([...selectedIds, id]);
    }
  };

  const handleQuickAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createAmenity({ title, status: "active" });
      onAmenitiesChange([...amenities, created]);
      onSelectedChange([...selectedIds, created.id]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add amenity.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-slate-800">Select amenities</Label>
        <p className="mt-0.5 text-xs text-slate-500">
          Default amenities are pre-selected. Tap to add or remove.
        </p>
      </div>

      {amenities.length === 0 ? (
        <AlertBanner variant="info">
          No amenities yet. Add one below, or manage the full list under{" "}
          <Link
            href="/customization/amenities"
            className="font-medium underline underline-offset-2"
          >
            Customization → Amenities
          </Link>
          .
        </AlertBanner>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {sortedAmenities.map((a) => {
            const selected = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                aria-pressed={selected}
                className={`relative flex min-h-24 items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  selected
                    ? "border-[#16233f] bg-[#16233f] text-white shadow-[0_8px_24px_rgba(22,35,63,0.16)]"
                    : "border-slate-200 bg-white text-[#16233f] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <AmenityIcon
                  title={a.title}
                  iconUrl={a.icon_url}
                  iconKey={a.icon_key}
                  size="md"
                  className={selected ? "bg-white" : undefined}
                />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm font-semibold leading-snug">
                    {a.title}
                  </span>
                  {a.is_default ? (
                    <span
                      className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${
                        selected ? "text-white/65" : "text-amber-600"
                      }`}
                    >
                      <Star className="size-3 fill-current" />
                      Default
                    </span>
                  ) : null}
                </span>
                <span
                  className={`absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full border ${
                    selected
                      ? "border-white/30 bg-white text-[#16233f]"
                      : "border-slate-200 bg-slate-50 text-transparent"
                  }`}
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-[#eef1f6]/40 p-3 sm:p-4">
        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Add amenity
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Infinity pool"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleQuickAdd();
              }
            }}
          />
          <Button
            type="button"
            className="gap-1.5 shrink-0"
            loading={adding}
            disabled={!newTitle.trim()}
            onClick={() => void handleQuickAdd()}
          >
            <Plus className="size-4" />
            Add &amp; select
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
