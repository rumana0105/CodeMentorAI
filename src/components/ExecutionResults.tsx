import React from "react";
import { Activity, Brain, CheckCircle2, Terminal, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { ExecutionResult } from "../types";
import { cn } from "../lib/utils";

import { explainError } from "../services/gemini";
import MarkdownRenderer from "./MarkdownRenderer";

interface ExecutionResultsProps {
  results: ExecutionResult[];
  isLoading: boolean;
  language: string;
  onRetry?: () => void;
}

type DiffOp =
  | { type: "equal"; text: string }
  | { type: "delete"; text: string }
  | { type: "insert"; text: string };

function diffLines(expected: string, actual: string): DiffOp[] {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const n = expectedLines.length;
  const m = actualLines.length;

  // Guard against pathological sizes to keep UI responsive.
  if (n > 200 || m > 200 || n * m > 40000) {
    const max = Math.max(n, m);
    const ops: DiffOp[] = [];
    for (let i = 0; i < max; i++) {
      const e = expectedLines[i];
      const a = actualLines[i];
      if (e === a) ops.push({ type: "equal", text: e ?? "" });
      else {
        if (e !== undefined) ops.push({ type: "delete", text: e });
        if (a !== undefined) ops.push({ type: "insert", text: a });
      }
    }
    return ops;
  }

  // LCS DP for line-level diff.
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = expectedLines[i - 1] === actualLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (expectedLines[i - 1] === actualLines[j - 1]) {
      ops.push({ type: "equal", text: expectedLines[i - 1] });
      i--;
      j--;
      continue;
    }
    if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: "delete", text: expectedLines[i - 1] });
      i--;
    } else {
      ops.push({ type: "insert", text: actualLines[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ type: "delete", text: expectedLines[i - 1] });
    i--;
  }
  while (j > 0) {
    ops.push({ type: "insert", text: actualLines[j - 1] });
    j--;
  }

  return ops.reverse();
}

function renderDiffSide(ops: DiffOp[], side: "expected" | "actual") {
  return (
    <pre className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
      {ops.map((op, idx) => {
        const last = idx === ops.length - 1;

        const span = (() => {
          if (op.type === "equal") {
            return <span className="whitespace-pre" key={idx}>{op.text}</span>;
          }
          if (side === "expected") {
            if (op.type === "delete") {
              return (
                <span key={idx} className="whitespace-pre bg-red-500/10 text-red-200 rounded px-1 -mx-1">
                  {op.text}
                </span>
              );
            }
            // insert placeholder
            return (
              <span key={idx} className="whitespace-pre bg-red-500/5 text-transparent rounded px-1 -mx-1">
                -
              </span>
            );
          }

          // side === "actual"
          if (op.type === "insert") {
            return (
              <span key={idx} className="whitespace-pre bg-green-500/10 text-green-200 rounded px-1 -mx-1">
                {op.text}
              </span>
            );
          }
          // delete placeholder
          return (
            <span key={idx} className="whitespace-pre bg-green-500/5 text-transparent rounded px-1 -mx-1">
              -
            </span>
          );
        })();

        return (
          <React.Fragment key={idx}>
            {span}
            {last ? null : <br />}
          </React.Fragment>
        );
      })}
    </pre>
  );
}

export default function ExecutionResults({ results = [], isLoading, language, onRetry }: ExecutionResultsProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [errorExplanations, setErrorExplanations] = React.useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    // If new results arrive and selectedIndex is out of range, clamp it.
    if (results.length === 0) setSelectedIndex(0);
    else setSelectedIndex((prev) => Math.min(prev, results.length - 1));
  }, [results.length]);

  const selected = results[selectedIndex];

  const handleExplainError = async (index: number, errorText: string) => {
    setLoadingExplanations((prev) => ({ ...prev, [index]: true }));
    try {
      const explanation = await explainError(errorText, language);
      setErrorExplanations((prev) => ({ ...prev, [index]: explanation }));
    } catch (err) {
      console.error("Failed to explain error", err);
    } finally {
      setLoadingExplanations((prev) => ({ ...prev, [index]: false }));
    }
  };

  if (results.length === 0 && isLoading) {
    return (
      <div className="bg-[#020617] rounded-3xl border border-[#1E293B] p-12 flex flex-col items-center justify-center text-slate-400 space-y-6 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] mb-2">Executing_Kernel</p>
          <p className="text-xs font-mono opacity-50">Running tests and collecting console output...</p>
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
          <p className="text-xs font-mono opacity-40 mt-1">Press `Run Code` to initiate test sequences.</p>
        </div>
      </div>
    );
  }

  const allPassed = results.every((r) => r.passed);
  const environmentError = results.some((r) => r.environmentError);
  const totalDurationMs = results.reduce((acc, r) => acc + (r.durationMs || 0), 0);
  const avgDurationMs = results.length > 0 ? totalDurationMs / results.length : 0;

  const statusPill = (
    <div
      className={cn(
        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2",
        allPassed
          ? "bg-green-500/10 text-green-500 border border-green-500/20"
          : "bg-red-500/10 text-red-500 border border-red-500/20"
      )}
    >
      {environmentError ? <AlertTriangle size={12} className="text-amber-400" /> : null}
      {allPassed ? "STATUS: SUCCESS" : environmentError ? "STATUS: ENV ERROR" : "STATUS: TEST FAILURES"}
    </div>
  );

  return (
    <div
      className="bg-[#020617] rounded-3xl border border-[#1E293B] overflow-hidden flex flex-col h-full shadow-2xl"
    >
      <motion.div
        className={cn(
          "px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-slate-900/40 backdrop-blur-md",
          allPassed && !environmentError ? "shadow-[0_0_28px_rgba(34,197,94,0.18)] ring-1 ring-green-500/20" : ""
        )}
        animate={environmentError || !allPassed ? { x: [0, -6, 6, -3, 3, 0] } : {}}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Evaluation Console</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-slate-500 bg-slate-900/20 border border-[#1E293B] whitespace-nowrap">
            Avg: {Math.round(avgDurationMs)}ms
          </div>
          {statusPill}
        </div>
      </motion.div>

      {/* LeetCode-style Test Case Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E293B] bg-slate-900/20">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2 shrink-0">
          Test Cases
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 min-w-max">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  i === selectedIndex
                    ? "bg-[#1E293B] border-[#4F46E5] text-[#B8B3FF]"
                    : "bg-slate-900/30 border-[#1E293B] text-slate-400 hover:border-slate-600"
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: r.passed ? "#22c55e" : r.environmentError ? "#f59e0b" : "#ef4444" }} />
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="ml-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Activity size={12} className="animate-spin" />
            Running...
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.05)_0%,transparent_50%)]">
        {environmentError && selected?.environmentError ? (
          <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 flex gap-4 items-start">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-200">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-black uppercase tracking-widest text-amber-200">
                Execution Environment Error – Retry
              </div>
              <div className="mt-2 text-xs font-mono text-amber-100/90 whitespace-pre-wrap">
                {selected.errorLogs}
              </div>
              {onRetry ? (
                <button
                  onClick={onRetry}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-black uppercase tracking-widest text-[10px] hover:bg-amber-400"
                >
                  <RefreshCcw size={14} />
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {selected ? (
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    selected.passed
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  )}
                >
                  {selected.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Test Case {selectedIndex + 1}
                  </h5>
                  <p className={cn("text-xs font-bold", selected.passed ? "text-green-400" : "text-red-400")}>
                    {selected.passed ? "Passed" : selected.environmentError ? "Environment error" : "Mismatch detected"}
                  </p>
                </div>
              </div>
              {!selected.passed && !selected.environmentError ? (
                <button
                  onClick={() => handleExplainError(selectedIndex, selected.errorLogs || selected.actualOutput)}
                  disabled={loadingExplanations[selectedIndex]}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-300 px-4 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <Brain size={12} className={loadingExplanations[selectedIndex] ? "animate-spin" : ""} />
                  {loadingExplanations[selectedIndex] ? "Analyzing..." : "Explain error"}
                </button>
              ) : null}
            </div>

            {errorExplanations[selectedIndex] && !selected.environmentError && !selected.passed ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">
                  <Brain size={14} />
                  Mentor Insight
                </div>
                <div className="text-xs text-slate-200/90 leading-relaxed font-medium">
                  <MarkdownRenderer content={errorExplanations[selectedIndex]} />
                </div>
              </div>
            ) : null}

            {/* Split into Input / Expected / Your Output / Error Logs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Input
                </div>
                <pre className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
                  {selected.input || "NULL"}
                </pre>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                  Expected Output
                </div>
                {selected.passed ? (
                  <pre className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-green-300 whitespace-pre-wrap overflow-x-auto">
                    {selected.expectedOutput}
                  </pre>
                ) : (
                  renderDiffSide(diffLines(selected.expectedOutput, selected.actualOutput), "expected")
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                  Your Output
                </div>
                {selected.passed ? (
                  <pre className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-green-300 whitespace-pre-wrap overflow-x-auto">
                    {selected.actualOutput || "No stdout"}
                  </pre>
                ) : (
                  renderDiffSide(diffLines(selected.expectedOutput, selected.actualOutput), "actual")
                )}
              </div>

              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  Error Logs
                </div>
                {selected.errorLogs ? (
                  <pre className="bg-[#020617] p-3 rounded-xl border border-[#1E293B] font-mono text-xs text-red-200/90 whitespace-pre-wrap overflow-x-auto">
                    {selected.errorLogs}
                  </pre>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    No stderr/error output for this test case.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
