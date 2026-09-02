"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const PLAN_KINDS = ["BHK", "Penthouse"] as const;
export type PlanKind = (typeof PLAN_KINDS)[number];

export function composePlanLabel(count: string, kinds: PlanKind[]) {
  const n = count.trim();
  const ordered = PLAN_KINDS.filter((kind) => kinds.includes(kind));
  const parts: string[] = [];
  for (const kind of ordered) {
    if (kind === "BHK") parts.push(n ? `${n} BHK` : "BHK");
    if (kind === "Penthouse") parts.push("Penthouse");
  }
  return parts.join(" ");
}

export function parsePlanLabel(value: string): {
  count: string;
  kinds: PlanKind[];
} {
  const raw = value.trim();
  const kinds: PlanKind[] = [];
  if (/penthouse/i.test(raw)) kinds.push("Penthouse");
  if (/bhk/i.test(raw)) kinds.push("BHK");
  const bhkCount = raw.match(/(\d+(?:\.\d+)?)\s*[-_]?\s*bhk/i);
  const count = bhkCount?.[1] ?? "";
  return { count, kinds };
}

type Props = {
  name: string;
  bhkLabel: string;
  onChange: (label: string) => void;
};

export function FloorPlanConfigField({ name, bhkLabel, onChange }: Props) {
  const parsed = parsePlanLabel(bhkLabel || name);
  const kinds =
    parsed.kinds.length > 0 || name.trim() || bhkLabel.trim()
      ? parsed.kinds
      : (["BHK"] as PlanKind[]);
  const count = parsed.count;
  const composed = composePlanLabel(count, kinds);
  const needsCount = kinds.includes("BHK") && !count;
  const typeSummary =
    kinds.length === 0
      ? "Type"
      : kinds.join(" · ");

  function emit(nextCount: string, nextKinds: PlanKind[]) {
    onChange(composePlanLabel(nextCount, nextKinds));
  }

  function toggleKind(kind: PlanKind) {
    const next = kinds.includes(kind)
      ? kinds.filter((item) => item !== kind)
      : [...kinds, kind];
    emit(count, next);
  }

  return (
    <div className="space-y-2 sm:col-span-3">
      <Label>Configuration</Label>
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,25,46,0.03)] focus-within:border-[#16233f]/40 focus-within:ring-4 focus-within:ring-[#16233f]/10">
        <input
          value={count}
          inputMode="decimal"
          disabled={!kinds.includes("BHK")}
          onChange={(e) => {
            const nextCount = e.target.value.replace(/[^\d.]/g, "");
            const nextKinds =
              nextCount && !kinds.includes("BHK") ? [...kinds, "BHK"] : kinds;
            emit(nextCount, nextKinds);
          }}
          placeholder={kinds.includes("BHK") ? "e.g. 3" : "—"}
          aria-label="BHK count"
          className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <div className="w-px self-stretch bg-slate-200" />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 min-w-[10.5rem] shrink-0 items-center justify-between gap-2 px-3 text-left text-sm text-slate-800 outline-none"
            >
              <span className="truncate font-medium">{typeSummary}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {PLAN_KINDS.map((kind) => {
              const selected = kinds.includes(kind);
              return (
                <DropdownMenuItem
                  key={kind}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleKind(kind);
                  }}
                  className="justify-between gap-3"
                >
                  <span>{kind}</span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      selected
                        ? "border-[#16233f] bg-[#16233f] text-white"
                        : "border-slate-300 bg-white text-transparent",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        {needsCount
          ? "Add the BHK count on the left. You can also select Penthouse."
          : composed
            ? "BHK and Penthouse show as separate tags on the website."
            : "Choose BHK, Penthouse, or both. Type the count when BHK is selected."}
      </p>
      {composed && !needsCount ? (
        <p className="text-sm text-[#16233f]">
          {kinds.includes("BHK") ? (
            <span className="font-semibold">
              {count ? `${count} BHK` : "BHK"}
            </span>
          ) : null}
          {kinds.includes("BHK") && kinds.includes("Penthouse") ? (
            <span className="mx-2 text-slate-300">|</span>
          ) : null}
          {kinds.includes("Penthouse") ? (
            <span className="font-medium text-slate-600">Penthouse</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
