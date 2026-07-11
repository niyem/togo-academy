// Minimal, safe markdown-lite renderer for lesson text.
// Handles: "## " headings, **bold**, `inline code`, $$ block formulas $$, and
// paragraphs. Full markdown + KaTeX math rendering is a Phase 1 upgrade; this
// keeps Phase 0 dependency-free and XSS-safe (no raw HTML injection).

import { Fragment, type ReactNode } from "react";

function renderInline(text: string, keyBase: string): ReactNode[] {
  // Split on **bold** and `code`, keeping delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function LessonProse({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className="prose-lesson">
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return <h2 key={key}>{renderInline(trimmed.slice(3), key)}</h2>;
        }

        // Block formula between $$ ... $$
        if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
          return (
            <div
              key={key}
              className="my-3 overflow-x-auto rounded-lg bg-togo-green-50 px-4 py-3 font-mono text-sm text-togo-green-900"
            >
              {trimmed.replace(/\$\$/g, "").trim()}
            </div>
          );
        }

        return <p key={key}>{renderInline(trimmed, key)}</p>;
      })}
    </div>
  );
}
