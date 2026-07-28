"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TextRow = { id: string; content: string };

type InlineTextRowsProps = {
  label: string;
  hint?: string;
  placeholder?: string;
  value: TextRow[];
  onChange: (rows: TextRow[]) => void;
  addLabel?: string;
};

export function InlineTextRows({
  label,
  hint,
  placeholder = "Enter highlight…",
  value,
  onChange,
  addLabel = "Add field",
}: InlineTextRowsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-slate-800">{label}</Label>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={() =>
            onChange([...value, { id: crypto.randomUUID(), content: "" }])
          }
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-[#eef1f6]/35 px-3 py-6 text-center text-xs text-slate-500">
          No items yet — click “{addLabel}” to add one. Tip: press Enter to add
          the next one quickly.
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((row, index) => (
            <li
              key={row.id}
              className="flex items-start gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-[0_1px_2px_rgba(16,25,46,0.03)]"
            >
              <span className="mt-2.5 w-5 shrink-0 text-center text-[11px] font-semibold text-slate-400">
                {index + 1}
              </span>
              <Input
                value={row.content}
                onChange={(e) =>
                  onChange(
                    value.map((r) =>
                      r.id === row.id ? { ...r, content: e.target.value } : r,
                    ),
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && row.content.trim()) {
                    e.preventDefault();
                    if (index === value.length - 1) {
                      onChange([
                        ...value,
                        { id: crypto.randomUUID(), content: "" },
                      ]);
                    }
                  }
                }}
                placeholder={placeholder}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-600 hover:bg-red-50"
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
