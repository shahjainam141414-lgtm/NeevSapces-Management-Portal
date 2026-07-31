"use client";

import { useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const TOOLS = [
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "insertUnorderedList", label: "Bullet list", icon: List },
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
  { command: "justifyLeft", label: "Align left", icon: AlignLeft },
  { command: "justifyCenter", label: "Align center", icon: AlignCenter },
  { command: "justifyRight", label: "Align right", icon: AlignRight },
  { command: "removeFormat", label: "Clear formatting", icon: RemoveFormatting },
  { command: "undo", label: "Undo", icon: Undo2 },
  { command: "redo", label: "Redo", icon: Redo2 },
] as const;

function normalizeEmptyHtml(value: string) {
  return /^(<br\s*\/?>|<div><br\s*\/?><\/div>|<p><br\s*\/?><\/p>)$/i.test(
    value.trim(),
  )
    ? ""
    : value;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here…",
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor === document.activeElement) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const runCommand = (command: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false);
    onChange(normalizeEmptyHtml(editor.innerHTML));
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,25,46,0.04)]",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {TOOLS.map((tool, index) => (
          <span key={tool.command} className="contents">
            {index === 2 || index === 4 || index === 7 || index === 8 ? (
              <span className="mx-1 h-7 w-px bg-slate-200" aria-hidden />
            ) : null}
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                runCommand(tool.command);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white hover:text-[#16233f] hover:shadow-sm"
              aria-label={tool.label}
              title={tool.label}
            >
              <tool.icon className="size-4" strokeWidth={1.8} />
            </button>
          </span>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) =>
          onChange(
            normalizeEmptyHtml((event.currentTarget as HTMLDivElement).innerHTML),
          )
        }
        className="min-h-64 px-5 py-4 text-sm leading-7 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_b]:font-semibold [&_div]:min-h-7 [&_i]:italic [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:min-h-7 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
