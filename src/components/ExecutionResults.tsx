import React from "react";
import { CheckCircle2, XCircle, Terminal, Activity, Brain } from "lucide-react";
import { ExecutionResult } from "../types";
import { cn } from "../lib/utils";

import { explainError } from "../services/gemini";
import MarkdownRenderer from "./MarkdownRenderer";

interface ExecutionResultsProps {
  results: ExecutionResult[];
  isLoading: boolean;
  language: string;
}

export default function ExecutionResults({ results = [], isLoading, language }: ExecutionResultsProps) {
  const [errorExplanations, setErrorExplanations] = React.useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = React.useState<Record<number, boolean>>({});

  const handleExplainError = async (index: number, error: string) => {
    setLoadingExplanations(prev => ({ ...prev, [index]: true }));
    try {
      const explanation = await explainError(error, language);
      setErrorExplanations(prev => ({ ...prev, [index]: explanation }));
    } catch (err) {
      console.error("Failed to explain error", err);
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [index]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#020617] rounded-3xl border border-[#1E293B] p-12 flex flex-col items-center justify-center text-slate-400 space-y-6 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] mb-2">Executing_Kernel</p>
          <p className="text-xs font-mono opacity-50">Transmitting packets to evaluation server...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-[#020617] rounded-3xl border border-[#1E293B] p-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
        <Terminal size={48} className="opacity-20 translate-y-2" />
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em]">Ready_To_Evaluate</p>
          <p className="text-xs font-mono opacity-40 mt-1">Press 'Run Code' to initiate test sequences.</p>
        </div>
      </div>
    );
  }

  const allPassed = results.every((r) => r.passed);

  return (
    <div className="bg-[#020617] rounded-3xl border border-[#1E293B] overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Terminal_STDOUT</span>
        </div>
        <div className={cn(
          "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
          allPassed ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {allPassed ? "STATUS: SUCCESS" : "STATUS: ERROR DETECTED"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.05)_0%,transparent_50%)]">
        {results.map((result, index) => (
          <div key={index} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  result.passed ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {result.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Test_Case {index + 1}</h5>
                  <p className={cn("text-xs font-bold", result.passed ? "text-green-500" : "text-red-500")}>
                    {result.passed ? "Verification Passed" : "Mismatch Detected"}
                  </p>
                </div>
              </div>
              {!result.passed && (
                <button
                  onClick={() => handleExplainError(index, result.actualOutput)}
                  disabled={loadingExplanations[index]}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <Activity size={12} className={loadingExplanations[index] ? "animate-pulse" : ""} />
                  {loadingExplanations[index] ? "AI Analyzing..." : "Heuristic Explain"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] text-[#475569] uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  Buffer_Input
                </p>
                <div className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
                  {result.input || "NULL"}
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] text-[#475569] uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                  Expected_Vector
                </p>
                <div className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-green-400/80 whitespace-pre-wrap overflow-x-auto">
                  {result.expectedOutput}
                </div>
              </div>
            </div>

            {!result.passed && (
              <div className="space-y-4">
                <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                  <p className="text-[9px] text-red-400/60 uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                    Actual_Output_Mismatch
                  </p>
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap">{result.actualOutput}</pre>
                  </div>
                </div>
                
                {errorExplanations[index] && (
                  <div className="bg-primary/5 p-5 rounded-3xl border border-primary/20 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                      <Brain size={14} />
                      AI_Diagnostic_Insight
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed font-medium">
                      <MarkdownRenderer content={errorExplanations[index]} />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {index < results.length - 1 && <div className="h-px bg-slate-900" />}
          </div>
        ))}
      </div>
    </div>
  );
}
