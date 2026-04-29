import React, { useState } from "react";
import { Play, Copy, Check, Terminal } from "lucide-react";
import { cn } from "../lib/utils";

interface CodeSnippetProps {
  code: string;
  title?: string;
}

export default function CodeSnippet({ code, title }: CodeSnippetProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: "python",
          testCases: [{ input: "", expectedOutput: "" }], // Dummy test case
        }),
      });
      const data = await response.json();
      setOutput(data.results[0]?.actualOutput || "No output");
    } catch (error) {
      setOutput("Error executing snippet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 bg-[#1A1A1A] rounded-2xl border border-[#334155] overflow-hidden shadow-lg">
      <div className="bg-[#2D2D2D] px-4 py-2 flex items-center justify-between border-b border-[#3D3D3D]">
        <span className="text-xs font-mono text-gray-400">{title || "example.py"}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-[#3D3D3D] rounded-lg transition-colors text-gray-400"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            <Play size={12} fill="currentColor" />
            {isLoading ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto custom-scrollbar dark">
        <code>{code}</code>
      </pre>
      {output !== null && (
        <div className="bg-[#0F172A] border-t border-[#334155] p-4">
          <div className="flex items-center gap-2 text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider mb-2">
            <Terminal size={12} />
            Output
          </div>
          <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
