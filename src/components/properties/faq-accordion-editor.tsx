"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FaqRow = { id: string; question: string; answer: string };

type FaqAccordionEditorProps = {
  value: FaqRow[];
  onChange: (rows: FaqRow[]) => void;
};

export function FaqAccordionEditor({ value, onChange }: FaqAccordionEditorProps) {
  const [openId, setOpenId] = useState<string | null>(value[0]?.id ?? null);

  const addFaq = () => {
    const id = crypto.randomUUID();
    onChange([...value, { id, question: "", answer: "" }]);
    setOpenId(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-slate-800">FAQs</Label>
          <p className="mt-0.5 text-xs text-slate-500">
            Add questions buyers ask — expand each item to edit answer.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={addFaq}
        >
          <Plus className="size-3.5" />
          Add FAQ
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-[#eef1f6]/35 px-3 py-6 text-center text-xs text-slate-500">
          No FAQs yet — add your first question &amp; answer.
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((faq, index) => {
            const open = openId === faq.id;
            return (
              <li
                key={faq.id}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(16,25,46,0.03)]"
              >
                <div className="flex items-center gap-1 border-b border-slate-100 bg-[#eef1f6]/40">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 px-3 py-3 text-left"
                    onClick={() => setOpenId(open ? null : faq.id)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#16233f]/8 text-[11px] font-semibold text-[#16233f]">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-800">
                      {faq.question.trim() || "New question"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-slate-400 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mr-1 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      onChange(value.filter((r) => r.id !== faq.id));
                      if (openId === faq.id) setOpenId(null);
                    }}
                    aria-label="Remove FAQ"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {open && (
                  <div className="space-y-3 p-3 sm:p-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) =>
                          onChange(
                            value.map((r) =>
                              r.id === faq.id
                                ? { ...r, question: e.target.value }
                                : r,
                            ),
                          )
                        }
                        placeholder="Is the project RERA registered?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) =>
                          onChange(
                            value.map((r) =>
                              r.id === faq.id
                                ? { ...r, answer: e.target.value }
                                : r,
                            ),
                          )
                        }
                        rows={3}
                        placeholder="Yes. RERA number is …"
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
