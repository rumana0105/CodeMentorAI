import React from "react";
import { Badge } from "../types";
import { Award, Calendar } from "lucide-react";
import { motion } from "motion/react";

interface BadgesProps {
  badges: Badge[];
}

export default function Badges({ badges }: BadgesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-[#E5E7EB] dark:border-[#334155] shadow-sm flex flex-col items-center text-center space-y-3 group hover:border-[#4F46E5] dark:hover:border-[#818CF8] transition-all"
        >
          <div className="w-16 h-16 bg-[#EEF2FF] dark:bg-[#312E81] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            {badge.icon}
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">{badge.name}</h4>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] leading-tight">{badge.description}</p>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-wider">
            <Calendar size={10} />
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
      {badges.length === 0 && (
        <div className="col-span-full py-12 text-center space-y-4 opacity-50">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
            <Award size={32} />
          </div>
          <p className="text-sm font-medium">Solve problems to unlock badges!</p>
        </div>
      )}
    </div>
  );
}
