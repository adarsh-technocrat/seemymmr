"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";

// Import Prism components for syntax highlighting
if (typeof window !== "undefined") {
  try {
    require("prismjs/components/prism-markup");
    require("prismjs/components/prism-javascript");
    require("prismjs/components/prism-jsx");
    require("prismjs/components/prism-tsx");
    require("prismjs/components/prism-typescript");
    require("prismjs/components/prism-json");
    require("prismjs/components/prism-bash");
    require("prismjs/components/prism-css");
  } catch (e) {
    // Prism components already loaded or failed to load
  }
}
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopyButton?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "markup",
  showCopyButton = true,
  className = "",
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Ensure Prism is loaded before highlighting
    if (codeRef.current && typeof window !== "undefined") {
      // Small delay to ensure Prism components are loaded
      const timer = setTimeout(() => {
        try {
          Prism.highlightElement(codeRef.current!);
        } catch (error) {
          // Prism highlighting error
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [code, language]);

  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        // You could add a toast notification here if needed
      } catch (err) {
        // Failed to copy code
      }
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-neutral min-w-0 max-w-full ${className}`}
    >
      <pre
        ref={preRef}
        className="text-xs p-4 min-w-0 max-w-full"
        style={{
          margin: 0,
          background: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
      >
        <code
          ref={codeRef}
          className={`language-${language}`}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            overflowWrap: "break-word",
          }}
        >
          {code}
        </code>
      </pre>
      {showCopyButton && (
        <div className="absolute right-2 top-2 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="btn-square"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 opacity-80 transition-opacity duration-200 hover:opacity-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
