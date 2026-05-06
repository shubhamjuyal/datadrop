"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  value: unknown;
}

export function JsonViewer({ value }: Props) {
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <SyntaxHighlighter
        language="json"
        style={oneDark}
        customStyle={{ margin: 0, padding: "1rem", background: "#1e1e2e" }}
        wrapLongLines
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}
