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
import { joinBuilderNames } from "@/lib/properties";
import type { Builder, BuilderStatus } from "@/lib/builders";
import { cn } from "@/lib/utils";
import { useNestedWheelScroll } from "@/hooks/useNestedWheelScroll";

type BuilderSelectFieldProps = {
  builders: Builder[];
  value: string[];
  onChange: (builderIds: string[], developerName: string) => void;
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);

  useEffect(() => setMounted(true), []);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const options = useMemo(() => {
    return [...builders]
      .filter((b) => b.status === "active" || selectedSet.has(b.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [builders, selectedSet]);

  const selected = useMemo(
    () =>
      value
        .map((id) => options.find((b) => b.id === id) ?? builders.find((b) => b.id === id))
        .filter((b): b is Builder => Boolean(b)),
    [value, options, builders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((b) => b.name.toLowerCase().includes(q));
  }, [options, query]);

  const emit = useCallback(
    (ids: string[]) => {
      const unique = [...new Set(ids)];
      const names = unique
        .map(
          (id) =>
            builders.find((b) => b.id === id)?.name ??
            options.find((b) => b.id === id)?.name ??
            "",
        )
        .filter(Boolean);
      onChange(unique, joinBuilderNames(names));
    },
    [builders, onChange, options],
  );

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
      width: Math.max(rect.width, Math.min(rect.width, window.innerWidth - 24)),
      maxHeight: Math.max(180, Math.min(preferred, available)),
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, filtered.length, selected.length]);

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

  const toggleBuilder = (builder: Builder) => {
    if (selectedSet.has(builder.id)) {
      emit(value.filter((id) => id !== builder.id));
      return;
    }
    emit([...value, builder.id]);
  };

  const removeBuilder = (builderId: string) => {
    emit(value.filter((id) => id !== builderId));
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
    const nextBuilders = [...builders, created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    onBuildersChange(nextBuilders);
    const ids = [...value, created.id];
    onChange(ids, joinBuilderNames([...selected.map((b) => b.name), created.name]));
  };

  const panel =
    open && mounted && pos
      ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
            data-lenis-prevent
            className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(16,25,46,0.18)]"
            style={{
              top: pos.openUp ? undefined : pos.top,
              bottom: pos.openUp
                ? window.innerHeight - pos.top
                : undefined,
              left: Math.min(pos.left, window.innerWidth - pos.width - 12),
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
                {filtered.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    No builders match “{query.trim()}”
                  </p>
                ) : (
                  filtered.map((builder) => {
                    const active = selectedSet.has(builder.id);
                    return (
                      <button
                        key={builder.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => toggleBuilder(builder)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#16233f]/6 hover:text-[#16233f]",
                          active && "font-medium text-[#16233f]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded border",
                            active
                              ? "border-[#16233f] bg-[#16233f] text-white"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
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

      <div
        ref={triggerRef}
        id={fieldId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-multiselectable="true"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,25,46,0.03)] transition-all duration-200 hover:border-slate-300 focus:border-[#16233f]/40 focus:outline-none focus:ring-4 focus:ring-[#16233f]/10",
          open && "border-[#16233f]/40 ring-4 ring-[#16233f]/10",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {selected.map((builder) => (
          <span
            key={builder.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#16233f] py-0.5 pl-2.5 pr-1 text-[12px] font-medium text-white"
          >
            <span className="truncate">{builder.name}</span>
            <button
              type="button"
              aria-label={`Remove ${builder.name}`}
              onClick={(event) => {
                event.stopPropagation();
                removeBuilder(builder.id);
              }}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <span
          className={cn(
            "min-w-[8rem] flex-1 px-1.5 py-0.5",
            selected.length ? "text-slate-400" : "text-slate-400",
          )}
        >
          {selected.length ? "Add another…" : "Search or select builders"}
        </span>
        <ChevronsUpDown className="mr-1 h-4 w-4 shrink-0 text-slate-400" />
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
