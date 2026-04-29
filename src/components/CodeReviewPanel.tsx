import React from "react";
import { Sparkles, Zap, Code, ShieldCheck, Star, AlertTriangle, Bug } from "lucide-react";
import { CodeReview } from "../types";
import { cn } from "../lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";

interface CodeReviewPanelProps {
  review: CodeReview | null;
  isLoading: boolean;
  onReview: () => void;
}

export default function CodeReviewPanel({ review, isLoading, onReview }: CodeReviewPanelProps) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] shadow-sm flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-6 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#1E293B]">
        <div className="flex items-center gap-3 text-[#4F46E5] dark:text-[#818CF8]">
          <ShieldCheck size={24} />
          <div>
            <h3 className="font-bold text-sm">AI Code Review</h3>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider font-bold">Style • Efficiency • Bugs</p>
          </div>
        </div>
        <button
          onClick={onReview}
          disabled={isLoading}
          className="bg-[#4F46E5] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            "Request Review"
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {!review && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-[#EEF2FF] dark:bg-[#312E81] rounded-3xl flex items-center justify-center text-[#4F46E5] dark:text-[#818CF8]">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-[#1A1A1A] dark:text-white">Ready for a deep dive?</h4>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                Get professional feedback on your code style, efficiency, and programming best practices.
              </p>
            </div>
          </div>
        )}

        {isLoading && (
            <div className="space-y-6 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                <div className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl" />
                </div>
            ))}
            </div>
        )}

        {review && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F172A] rounded-[2.5rem] text-white shadow-xl">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-indigo-400">
                <Sparkles size={14} />
                Mentor's Executive Summary
              </h4>
              <div className="text-sm text-gray-300 leading-relaxed font-medium">
                <MarkdownRenderer content={review.overallFeedback} />
              </div>
            </div>

            <ReviewSection icon={Bug} title="Potential Bugs" content={review.potentialBugs} color="text-red-500" bg="bg-red-50 dark:bg-red-500/10" />
            <ReviewSection icon={Star} title="Style & Readability" content={review.style} color="text-yellow-500" bg="bg-yellow-50 dark:bg-yellow-500/10" />
            <ReviewSection icon={Zap} title="Efficiency & Optimizations" content={review.optimizations} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
            <ReviewSection icon={AlertTriangle} title="Edge Cases" content={review.edgeCases} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" />
            <ReviewSection icon={Code} title="Best Practices" content={review.bestPractices} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ icon: Icon, title, content, color, bg }: any) {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-xl transition-transform group-hover:scale-110", bg, color)}>
          <Icon size={16} />
        </div>
        <h4 className="font-black text-[10px] text-[#1A1A1A] dark:text-white uppercase tracking-[0.1em]">{title}</h4>
      </div>
      <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-sm">
        <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-relaxed prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
}
