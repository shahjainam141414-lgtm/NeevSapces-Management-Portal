"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { BuilderFormDialog } from "@/components/customization/builder-form-dialog";
import { createBuilder } from "@/lib/builders-api";
import type { Builder, BuilderStatus } from "@/lib/builders";
import { cn } from "@/lib/utils";
import { useNestedWheelScroll } from "@/hooks/useNestedWheelScroll";

type BuilderSelectFieldProps = {
  builders: Builder[];
  value: string;
  onChange: (builderId: string, developerName: string) => void;
  onBuildersChange: (builders: Builder[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  hint?: string;
};

type PanelPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

export function BuilderSelectField({
  builders,
  value,
  onChange,
  onBuildersChange,
  label = "Builder / Brand",
  required = false,
  disabled = false,
  className,
  id,
  hint,
}: BuilderSelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);

  useEffect(() => setMounted(true), []);

  const options = useMemo(() => {
    return [...builders]
      .filter((b) => b.status === "active" || b.id === value)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [builders, value]);

  const selected = useMemo(
    () => options.find((b) => b.id === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((b) => b.name.toLowerCase().includes(q));
  }, [options, query]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const preferred = 280;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;

    setPos({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(180, Math.min(preferred, available)),
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, filtered.length]);

  useEffect(() => {
    if (!open) return;

    const onReposition = () => updatePosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
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
    const t = window.setTimeout(() => searchRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useNestedWheelScroll(listRef, open);

  const closePanel = () => {
    setOpen(false);
    setQuery("");
  };

  const selectNone = () => {
    onChange("", "");
    closePanel();
  };

  const selectBuilder = (builder: Builder) => {
    onChange(builder.id, builder.name);
    closePanel();
  };

  const openAddBrand = () => {
    closePanel();
    setAddOpen(true);
  };

  const handleAdd = async (data: {
    name: string;
    status: BuilderStatus;
    logo_url?: string | null;
    cloudinary_public_id?: string | null;
  }) => {
    const created = await createBuilder({
      name: data.name,
      tier: 1,
      status: data.status,
      website: null,
      logo_url: data.logo_url,
      cloudinary_public_id: data.cloudinary_public_id,
    });
    onBuildersChange(
      [...builders, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
    onChange(created.id, created.name);
  };

  const panel =
    open && mounted && pos
      ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            data-lenis-prevent
            className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(16,25,46,0.18)]"
            style={{
              top: pos.openUp ? undefined : pos.top,
              bottom: pos.openUp
                ? window.innerHeight - pos.top
                : undefined,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search builders…"
                  className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div
                ref={listRef}
                data-lenis-prevent
                className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
                style={{
                  maxHeight: Math.max(120, pos.maxHeight - 108),
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={selectNone}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-[#16233f]/6 hover:text-[#16233f]",
                    !value && "font-medium text-[#16233f]",
                  )}
                >
                  <span className="grid h-4 w-4 place-items-center">
                    {!value ? <Check className="h-4 w-4" /> : null}
                  </span>
                  None
                </button>

                {filtered.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    No builders match “{query.trim()}”
                  </p>
                ) : (
                  filtered.map((builder) => {
                    const active = builder.id === value;
                    return (
                      <button
                        key={builder.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => selectBuilder(builder)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#16233f]/6 hover:text-[#16233f]",
                          active && "font-medium text-[#16233f]",
                        )}
                      >
                        <span className="grid h-4 w-4 place-items-center">
                          {active ? <Check className="h-4 w-4" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {builder.name}
                          {builder.status !== "active" ? " (inactive)" : ""}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="shrink-0 border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={openAddBrand}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#16233f] transition hover:bg-[#16233f]/6"
                >
                  <Plus className="h-4 w-4" />
                  Add brand
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>

      <div className="relative">
        <button
          ref={triggerRef}
          id={fieldId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => {
              const next = !prev;
              if (!next) setQuery("");
              return next;
            });
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,25,46,0.03)] transition-all duration-200 hover:border-slate-300 focus:border-[#16233f]/40 focus:outline-none focus:ring-4 focus:ring-[#16233f]/10 disabled:cursor-not-allowed disabled:opacity-50",
            open && "border-[#16233f]/40 ring-4 ring-[#16233f]/10",
          )}
        >
          <span
            className={cn(
              "truncate",
              selected ? "font-medium text-slate-900" : "text-slate-400",
            )}
          >
            {selected ? selected.name : "Search or select builder"}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {selected ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear builder"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("", "");
                }}
                className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 text-slate-400" />
          </span>
        </button>
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {panel}

      <BuilderFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />
    </div>
  );
}
