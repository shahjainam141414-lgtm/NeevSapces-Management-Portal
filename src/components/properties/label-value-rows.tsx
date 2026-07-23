"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LabelValueRow = { id: string; label: string; value: string };

type LabelValueRowsProps = {
  title?: string;
  hint?: string;
  value: LabelValueRow[];
  onChange: (rows: LabelValueRow[]) => void;
  addLabel?: string;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
};

export function LabelValueRows({
  title = "Specifications",
  hint,
  value,
  onChange,
  addLabel = "Add field",
  labelPlaceholder = "Label",
  valuePlaceholder = "Value",
}: LabelValueRowsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-slate-800">{title}</Label>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={() =>
            onChange([
              ...value,
              { id: crypto.randomUUID(), label: "", value: "" },
            ])
          }
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-[#eef1f6]/35 px-3 py-6 text-center text-xs text-slate-500">
          No specs yet — add label + value pairs (e.g. Flooring → Vitrified tiles).
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((row) => (
            <li
              key={row.id}
              className="grid gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-[0_1px_2px_rgba(16,25,46,0.03)] sm:grid-cols-[1fr_1.4fr_auto]"
            >
              <Input
                value={row.label}
                onChange={(e) =>
                  onChange(
                    value.map((r) =>
                      r.id === row.id ? { ...r, label: e.target.value } : r,
                    ),
                  )
                }
                placeholder={labelPlaceholder}
              />
              <Input
                value={row.value}
                onChange={(e) =>
                  onChange(
                    value.map((r) =>
                      r.id === row.id ? { ...r, value: e.target.value } : r,
                    ),
                  )
                }
                placeholder={valuePlaceholder}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="justify-self-end text-red-600 hover:bg-red-50 sm:justify-self-center"
                onClick={() => onChange(value.filter((r) => r.id !== row.id))}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
