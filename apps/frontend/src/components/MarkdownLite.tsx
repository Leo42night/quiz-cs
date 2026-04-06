import { lazy, Suspense } from "react"
import "highlight.js/styles/atom-one-dark.css"

// 1. IMPORT CORE SAJA (Tanpa bahasa apapun)
import hljs from 'highlight.js/lib/core';

// 2. IMPORT BAHASA YANG ANDA BUTUHKAN SAJA
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml'; // untuk HTML

// 3. REGISTER MANUAL
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);

// 4. PLUGIN REHYPE KHUSUS (Ringan)
import rehypeHighlight from "rehype-highlight"

const ReactMarkdown = lazy(() => import("react-markdown"))

export default function MarkdownLite({ content }: { content: string }) {
  return (
    <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-md" />}>
      <ReactMarkdown 
        rehypePlugins={[
          [rehypeHighlight, { 
            // Hanya deteksi bahasa yang sudah di-register di atas
            languages: { javascript, typescript, css, xml } 
          }]
        ]}
      >
        {content}
      </ReactMarkdown>
    </Suspense>
  )
}