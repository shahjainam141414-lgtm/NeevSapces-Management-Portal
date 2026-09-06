"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EntityItem } from "@/lib/static-options";

type NearbyAreasFieldProps = {
  areas: EntityItem[];
  excludeId?: string | null;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function NearbyAreasField({
  areas,
  excludeId,
  value,
  onChange,
  disabled = false,
}: NearbyAreasFieldProps) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const pool = useMemo(
    () =>
      areas
        .filter((area) => area.id !== excludeId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [areas, excludeId],
  );

  const selected = useMemo(() => {
    const map = new Map(pool.map((a) => [a.id, a]));
    return value
      .map((id) => map.get(id))
      .filter((item): item is EntityItem => Boolean(item));
  }, [pool, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((area) => area.name.toLowerCase().includes(q));
  }, [pool, query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  };

  const remove = (id: string) => {
    if (disabled) return;
    onChange(value.filter((x) => x !== id));
  };

  const triggerLabel =
    selected.length === 0
      ? "Select nearby areas"
      : selected.length <= 2
        ? selected.map((a) => a.name).join(", ")
        : `${selected.length} areas selected`;

  return (
    <div ref={rootRef} className="space-y-2">
      <Label htmlFor={fieldId} className="text-slate-700">
        Nearby areas
      </Label>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((area) => (
            <span
              key={area.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#16233f]/15 bg-[#16233f]/5 py-1 pl-2.5 pr-1 text-xs font-medium text-[#16233f]"
            >
              <span className="truncate">{area.name}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(area.id)}
                className="grid size-5 place-items-center rounded-full text-[#16233f]/70 transition hover:bg-[#16233f]/10 hover:text-[#16233f] disabled:opacity-60"
                aria-label={`Remove ${area.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <button
          id={fieldId}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => {
              const next = !prev;
              if (!next) setQuery("");
              return next;
            });
          }}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm transition",
            open
              ? "border-[#16233f]/35 ring-2 ring-[#16233f]/10"
              : "hover:border-slate-300",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              selected.length ? "text-slate-800" : "text-slate-400",
            )}
          >
            {triggerLabel}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
        </button>

        {open ? (
          <div
            role="listbox"
            aria-multiselectable="true"
            data-lenis-prevent
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(16,25,46,0.14)]"
            onMouseDown={(event) => {
              // Keep focus in the search field; don't collapse on option press.
              event.preventDefault();
            }}
          >
            <div className="relative border-b border-slate-100">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search areas…"
                className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="scrollbar-thin max-h-48 overflow-y-auto overscroll-contain p-1.5 sm:max-h-56">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-500">
                  {pool.length === 0
                    ? "Add more areas first."
                    : "No areas match your search."}
                </p>
              ) : (
                filtered.map((area) => {
                  const active = value.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => toggle(area.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
                        active
                          ? "bg-[#16233f]/6 text-[#16233f]"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border",
                          active
                            ? "border-[#16233f] bg-[#16233f] text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {active ? (
                          <Check className="size-2.5" strokeWidth={3} />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {area.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
