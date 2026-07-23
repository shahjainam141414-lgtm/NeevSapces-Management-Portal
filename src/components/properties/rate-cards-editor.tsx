"use client";

import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import type { PropertyRateCard } from "@/lib/properties";

type RateCardsEditorProps = {
  value: PropertyRateCard[];
  onChange: (cards: PropertyRateCard[]) => void;
};

function emptyCard(): PropertyRateCard {
  return {
    id: crypto.randomUUID(),
    title: "",
    price: "",
    notes: "",
  };
}

const cardMotion = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.25 },
});

export function RateCardsEditor({ value, onChange }: RateCardsEditorProps) {
  const update = (index: number, patch: Partial<PropertyRateCard>) => {
    onChange(value.map((card, i) => (i === index ? { ...card, ...patch } : card)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">Pricing cards</p>
          <p className="text-xs text-slate-500">
            Add package, per sq.ft., or custom price cards shown on the listing.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 self-start"
          onClick={() => onChange([...value, emptyCard()])}
        >
          <Plus className="size-4" />
          Add rate card
        </Button>
      </div>

      {value.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-[#eef1f6]/40">
          <CardContent className="py-10">
            <EmptyState
              title="No rate cards yet"
              description="Add a package price or price per sq.ft. card for this project."
            />
          </CardContent>
        </Card>
      ) : (
        value.map((card, index) => (
          <motion.div key={card.id} {...cardMotion(index)}>
            <Card className="overflow-hidden border-slate-200/90 shadow-[0_1px_2px_rgba(16,25,46,0.04)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-[#eef1f6]/50 py-3">
                <CardTitle className="text-sm font-semibold text-[#16233f]">
                  Rate card {index + 1}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() =>
                    onChange(value.filter((_, i) => i !== index))
                  }
                  aria-label="Remove rate card"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={card.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                    placeholder="Package price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    value={card.price}
                    onChange={(e) => update(index, { price: e.target.value })}
                    placeholder="1.55 Cr.*"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={card.notes}
                    onChange={(e) => update(index, { notes: e.target.value })}
                    placeholder="Incl. all charges — onwards*"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}
