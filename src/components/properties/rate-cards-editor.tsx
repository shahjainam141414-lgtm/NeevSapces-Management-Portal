"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  autoPriceRangeFromCards,
  type PropertyRateCard,
} from "@/lib/properties";
import {
  PRICE_UNITS,
  formatCardPrice,
  parseDecimal,
  sanitizeDecimalInput,
  type PriceUnit,
} from "@/lib/pricing";

type RateCardsEditorProps = {
  value: PropertyRateCard[];
  onChange: (cards: PropertyRateCard[]) => void;
  rangeLabel: string;
  onRangeChange: (label: string) => void;
  lockRangeInitially?: boolean;
};

function emptyCard(): PropertyRateCard {
  return {
    id: crypto.randomUUID(),
    title: "",
    price: "",
    notes: "",
    amount: null,
    unit: "lac",
  };
}

const cardMotion = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: Math.min(i, 6) * 0.03, duration: 0.22 },
});

function draftFromAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  return String(amount);
}

export function RateCardsEditor({
  value,
  onChange,
  rangeLabel,
  onRangeChange,
  lockRangeInitially = false,
}: RateCardsEditorProps) {
  const [rangeManual, setRangeManual] = useState(lockRangeInitially);
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        value.map((c) => [c.id, draftFromAmount(c.amount)]),
      ),
  );
  const lastAutoRef = useRef("");

  useEffect(() => {
    setAmountDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const card of value) {
        next[card.id] =
          prev[card.id] !== undefined
            ? prev[card.id]
            : draftFromAmount(card.amount);
      }
      return next;
    });
  }, [value]);

  useEffect(() => {
    const auto = autoPriceRangeFromCards(value);
    lastAutoRef.current = auto;
    if (!rangeManual && auto !== rangeLabel) {
      onRangeChange(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from cards only
  }, [value, rangeManual]);

  const update = (index: number, patch: Partial<PropertyRateCard>) => {
    onChange(
      value.map((card, i) => {
        if (i !== index) return card;
        const next = { ...card, ...patch };
        const amount =
          patch.amount !== undefined ? patch.amount : next.amount;
        const unit = (patch.unit !== undefined ? patch.unit : next.unit) as
          | PriceUnit
          | null
          | undefined;
        if (amount != null && unit) {
          next.price = formatCardPrice(amount, unit);
        } else if (amount == null) {
          next.price = "";
        }
        return next;
      }),
    );
  };

  const setAmountDraft = (cardId: string, index: number, raw: string) => {
    const cleaned = sanitizeDecimalInput(raw);
    setAmountDrafts((prev) => ({ ...prev, [cardId]: cleaned }));
    const unit = value[index]?.unit ?? "lac";
    if (cleaned === "") {
      update(index, { amount: null, unit });
      return;
    }
    if (cleaned.endsWith(".")) {
      update(index, {
        amount: parseDecimal(cleaned.slice(0, -1)),
        unit,
      });
      return;
    }
    update(index, { amount: parseDecimal(cleaned), unit });
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-[#16233f]/12 bg-gradient-to-br from-[#eef1f6] via-white to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#16233f]/55">
              Website price range
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Shown above the configuration cards · calculated automatically
            </p>
          </div>
          {rangeManual ? (
            <button
              type="button"
              className="text-xs font-semibold text-[#16233f] underline underline-offset-2"
              onClick={() => {
                setRangeManual(false);
                onRangeChange(
                  lastAutoRef.current || autoPriceRangeFromCards(value),
                );
              }}
            >
              Reset to auto
            </button>
          ) : null}
        </div>
        <Input
          value={rangeLabel}
          onChange={(e) => {
            setRangeManual(true);
            onRangeChange(e.target.value);
          }}
          placeholder="e.g. 90 Lac. - 1.3 Cr.*"
          className="mt-3 h-12 border-slate-200/80 bg-white text-center font-display text-xl font-semibold tracking-tight text-[#16233f] shadow-sm placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">
            Range source prices
          </p>
          <p className="text-xs text-slate-500">
            Add each BHK starting price here to calculate the overall range.
            A matching Floor Plan is created automatically with its BHK and
            price prefilled.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 self-start"
          onClick={() => onChange([...value, emptyCard()])}
        >
          <Plus className="size-4" />
          Add range price
        </Button>
      </div>

      {value.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-[#eef1f6]/40">
          <CardContent className="py-10">
            <EmptyState
              title="No rate cards yet"
              description="Add BHK prices (Lac. / Cr.) to calculate the website price range."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((card, index) => (
            <motion.div key={card.id} {...cardMotion(index)} className="min-w-0">
              <Card className="h-full overflow-hidden border-slate-200/90 shadow-[0_1px_2px_rgba(16,25,46,0.04)]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-[#eef1f6]/50 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-[#16233f]">
                    Card {index + 1}
                    {card.price ? (
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {card.price}
                      </span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      onChange(value.filter((_, i) => i !== index))
                    }
                    aria-label="Remove rate card"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <CardContent className="space-y-3 p-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Title</Label>
                    <Input
                      value={card.title}
                      onChange={(e) =>
                        update(index, { title: e.target.value })
                      }
                      placeholder="3 BHK"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Price</Label>
                    <div className="flex gap-1.5">
                      <Input
                        inputMode="decimal"
                        value={amountDrafts[card.id] ?? ""}
                        onChange={(e) =>
                          setAmountDraft(card.id, index, e.target.value)
                        }
                        onBlur={() => {
                          const draft = amountDrafts[card.id] ?? "";
                          const cleaned = sanitizeDecimalInput(draft);
                          const amount = parseDecimal(cleaned);
                          setAmountDrafts((prev) => ({
                            ...prev,
                            [card.id]: amount == null ? "" : String(amount),
                          }));
                          update(index, {
                            amount,
                            unit: card.unit ?? "lac",
                          });
                        }}
                        placeholder="75"
                        className="h-9 w-[5.5rem] shrink-0 px-2.5 tabular-nums"
                      />
                      <Select
                        value={card.unit ?? "lac"}
                        onValueChange={(v) =>
                          update(index, { unit: v as PriceUnit })
                        }
                      >
                        <SelectTrigger className="h-9 min-w-0 flex-1 cursor-pointer px-2.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Notes</Label>
                    <Input
                      value={card.notes}
                      onChange={(e) =>
                        update(index, { notes: e.target.value })
                      }
                      placeholder="Incl. all charges*"
                      className="h-9"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
