/**
 * CodeEditor.tsx
 *
 * Editor kode interaktif menggunakan CodeJar + highlight.js.
 * Mendukung syntax highlighting real-time saat mengetik,
 * Menggunakan placeholder <<N>>
 *
 * Cara pakai:
 *   <CodeEditor
 *     value={template}
 *     onChange={setTemplate}
 *     language="javascript"
 *     blankStyle="exact"   // "exact" | "regex" | "none"
 *   />
 */

import { useEffect, useRef, useCallback } from "react";
import { CodeJar } from "codejar";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/atom-one-dark.css";
import { cn } from "@/lib/utils";

// register only the languages we need
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("xml", xml);

export type BlankStyle = "exact" | "regex" | "none";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  blankStyle?: BlankStyle;
  minHeight?: number;
  className?: string;
  readOnly?: boolean;
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Fungsi pembantu untuk mendeteksi placeholder baru.
 * Regex: <<(\d+)>> 
 * Menangkap kurung siku ganda dan angka di dalamnya.
 */
function buildHtml(code: string, language: string, blankStyle: BlankStyle): string {
  const blankClass =
    blankStyle === "regex" ? "fill-blank fill-blank-regex" : "fill-blank";

  // 1. MODIFIKASI REGEX: split berdasarkan <<angka>>
  // Menggunakan capturing group agar delimiter tetap ada di hasil array parts
  const parts = code.split(/(<<\d+>>)/);

  return parts
    .map((part) => {
      // 2. CEK FORMAT BARU: apakah part dimulai dengan << dan diakhiri >>
      if (/^<<\d+>>$/.test(part)) {
        // Ambil angka N untuk keperluan styling atau label jika perlu
        const size = part.match(/\d+/)?.[0] || "5";

        // Render sebagai span dengan class khusus agar bisa di-style di CSS
        // Kita simpan value aslinya (misal <<10>>) di attribute atau teks
        return `<span class="${blankClass}" data-size="${size}">${escHtml(part)}</span>`;
      }

      // Highlight syntax untuk segmen kode biasa
      try {
        return hljs.highlight(part, { language, ignoreIllegals: true }).value;
      } catch {
        return escHtml(part);
      }
    })
    .join("");
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  blankStyle = "none",
  minHeight = 140,
  className,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<ReturnType<typeof CodeJar> | null>(null);
  const valueRef = useRef(value);

  const highlight = useCallback(
    (el: HTMLElement) => {
      el.innerHTML = buildHtml(el.textContent ?? "", language, blankStyle);
    },
    [language, blankStyle]
  );

  // init CodeJar once
  useEffect(() => {
    if (!editorRef.current) return;

    const jar = CodeJar(editorRef.current, highlight, {
      tab: "  ",
      indentOn: /[({[]$/,
      spellcheck: false,
      catchTab: true,
      preserveIdent: true,
      history: true,
      addClosing: true,
    });

    jar.updateCode(value);
    jar.onUpdate((code) => {
      valueRef.current = code;
      onChange(code);
    });

    jarRef.current = jar;

    return () => {
      jar.destroy();
      jarRef.current = null;
    };
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync language / blankStyle change → re-highlight without losing caret
  useEffect(() => {
    jarRef.current?.updateOptions({ tab: "  " });
    if (editorRef.current) {
      highlight(editorRef.current);
    }
  }, [highlight]);

  // sync value prop → editor (only when external change)
  useEffect(() => {
    if (jarRef.current && value !== valueRef.current) {
      valueRef.current = value;
      jarRef.current.updateCode(value);
    }
  }, [value]);

  return (
    <div
      className={cn("codejar-wrap border border-input rounded-lg overflow-hidden", className)}
      style={{ background: "#282c34", color: "#abb2bf" }}
    >
      <div
        ref={editorRef}
        className={cn(
          "codejar-editor text-sm",
          readOnly && "pointer-events-none select-none"
        )}
        style={{ minHeight }}
        spellCheck={false}
        contentEditable={!readOnly}
        suppressContentEditableWarning
      />
    </div>
  );
}

/**
 * Read-only syntax-highlighted code block (no CodeJar overhead).
 */
interface CodePreviewProps {
  code: string;
  language?: string;
  blankStyle?: BlankStyle;
  className?: string;
}

export function CodePreview({
  code,
  language = "javascript",
  blankStyle = "none",
  className,
}: CodePreviewProps) {
  const html = buildHtml(code, language, blankStyle);
  return (
    <div
      className={cn("rounded-lg overflow-x-auto border border-input", className)}
      style={{ background: "#282c34" }}
    >
      <pre
        className="hljs p-4 text-sm leading-relaxed m-0 font-mono"
        style={{
          fontFamily:
            "'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,monospace",
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}