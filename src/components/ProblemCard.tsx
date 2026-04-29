import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Code, BarChart3, Lock } from "lucide-react";
import { Problem } from "../types";
import { cn } from "../lib/utils";

interface ProblemCardProps {
  problem: Problem;
  isLocked?: boolean;
}

export default function ProblemCard({ problem, isLocked }: ProblemCardProps) {
  const difficultyColors = {
    Easy: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Hard: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] p-6 hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", difficultyColors[problem.difficulty])}>
          {problem.difficulty}
        </div>
        <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-medium uppercase tracking-wider">{problem.category}</div>
      </div>

      <h3 className="text-lg font-bold mb-2 group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8] dark:text-white transition-colors">{problem.title}</h3>
      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] line-clamp-2 mb-6">{problem.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6] dark:border-[#334155]">
        <div className="flex items-center gap-4 text-xs text-[#9CA3AF] dark:text-[#64748B]">
          <div className="flex items-center gap-1">
            <Code size={14} />
            <span className="capitalize">{problem.languages.slice(0, 2).join(", ")}{problem.languages.length > 2 ? '...' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 size={14} />
            <span>{problem.tags.slice(0, 2).join(", ")}</span>
          </div>
        </div>
        {isLocked ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
            <Lock size={14} /> Locked
          </div>
        ) : (
          <Link
            to={`/problem/${problem.id}`}
            className="flex items-center gap-1 text-sm font-semibold text-[#4F46E5] dark:text-[#818CF8] hover:gap-2 transition-all"
          >
            Solve Now <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {isLocked && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] rounded-2xl pointer-events-none" />
      )}
    </div>
  );
}
