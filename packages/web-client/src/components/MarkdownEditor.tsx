/**
 * Markdown Editor Component
 * 
 * Simple WYSIWYG-like markdown editor with toolbar
 */

import { useState, useRef, useCallback } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Escreva seu conteúdo em Markdown...",
  minHeight = "200px",
  maxLength = 10000,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newValue);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [value, onChange]
  );

  const tools = [
    { icon: "𝐁", label: "Negrito", action: () => insertMarkdown("**", "**", "texto") },
    { icon: "𝐼", label: "Itálico", action: () => insertMarkdown("*", "*", "texto") },
    { icon: "H1", label: "Título", action: () => insertMarkdown("# ", "", "Título") },
    { icon: "H2", label: "Subtítulo", action: () => insertMarkdown("## ", "", "Subtítulo") },
    { icon: "—", label: "Lista", action: () => insertMarkdown("\n- ", "", "item") },
    { icon: "1.", label: "Lista numerada", action: () => insertMarkdown("\n1. ", "", "item") },
    { icon: "🔗", label: "Link", action: () => insertMarkdown("[", "](url)", "texto") },
    { icon: "📷", label: "Imagem", action: () => insertMarkdown("![", "](url)", "alt") },
    { icon: "`", label: "Código", action: () => insertMarkdown("`", "`", "código") },
    { icon: "```", label: "Bloco de código", action: () => insertMarkdown("\n```\n", "\n```\n", "código") },
    { icon: ">", label: "Citação", action: () => insertMarkdown("\n> ", "", "citação") },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/10">
        {tools.map((tool, idx) => (
          <button
            key={idx}
            type="button"
            onClick={tool.action}
            title={tool.label}
            className="p-2 hover:bg-secondary/20 rounded text-sm font-mono"
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1 rounded text-sm ${showPreview ? "bg-primary text-white" : "hover:bg-secondary/20"}`}
        >
          {showPreview ? "Editar" : "Preview"}
        </button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div
          className="p-4 prose prose-invert max-w-none"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent resize-y font-mono text-sm focus:outline-none"
          style={{ minHeight }}
          aria-label="Editor de conteúdo"
        />
      )}

      {/* Character count */}
      <div className="flex justify-end p-2 text-xs text-secondary border-t border-border">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}

// Simple markdown to HTML converter
function simpleMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Links and images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Blockquotes
    .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
    // Lists
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}
