import React from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "./ThemeProvider";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  highlightedLine?: number;
}

export default function CodeEditor({ code, onChange, language, highlightedLine }: CodeEditorProps) {
  const { theme } = useTheme();

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case "python": return "python";
      case "javascript": return "javascript";
      case "cpp": return "cpp";
      case "c": return "c";
      case "java": return "java";
      case "ruby": return "ruby";
      default: return "python";
    }
  };

  return (
    <div className="h-full bg-[#1A1A1A] dark:bg-[#0F172A] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] shadow-xl overflow-hidden flex flex-col transition-colors duration-300">
      <div className="bg-[#2D2D2D] dark:bg-[#1E293B] px-6 py-3 flex items-center justify-between border-b border-[#3D3D3D] dark:border-[#334155]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        <span className="text-xs font-mono text-gray-400 capitalize">{language}</span>
      </div>
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={code}
          onChange={(value) => onChange(value || "")}
          options={{
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 24, bottom: 24 },
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  );
}
