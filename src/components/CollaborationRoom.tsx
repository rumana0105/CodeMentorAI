import React, { useState } from "react";
import { Users, Link as LinkIcon, Copy, Check, LogOut, MessageSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../lib/utils";

interface CollaborationRoomProps {
  onJoin: (sessionId: string) => void;
  onLeave: () => void;
  activeSessionId: string | null;
  connectedUsers: string[];
}

export default function CollaborationRoom({ onJoin, onLeave, activeSessionId, connectedUsers }: CollaborationRoomProps) {
  const [targetId, setTargetId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    const newId = uuidv4().slice(0, 8);
    onJoin(newId);
  };

  const handleCopy = () => {
    if (activeSessionId) {
      navigator.clipboard.writeText(activeSessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
          <Users size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Collaborative Mode</h3>
          <p className="text-xs text-gray-500">Real-time pair programming</p>
        </div>
      </div>

      {!activeSessionId ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold ml-1">Session ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                placeholder="ENTER ID (e.g. A1B2C3D4)"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <button
                onClick={() => targetId && onJoin(targetId)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Join
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E7EB] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white dark:bg-[#1E293B] text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-3 bg-gray-100 dark:bg-[#334155] hover:bg-gray-200 dark:hover:bg-[#475569] text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-600"
          >
            Create New Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Current Session</span>
              <button onClick={handleCopy} className="text-primary hover:text-primary/80">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="text-xl font-mono font-black text-center tracking-widest text-[#4F46E5]">
              {activeSessionId}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Connected ({connectedUsers.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {connectedUsers.map((userId) => (
                <div 
                  key={userId}
                  className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-bold border border-indigo-500/20 animate-in fade-in zoom-in duration-300"
                >
                  User_{userId.slice(0, 4)}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onLeave}
            className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-red-500/20"
          >
            <LogOut size={16} />
            Leave Session
          </button>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#334155]">
        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <Users size={16} className="shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">
            Interviewer & Candidate share the same editor. Changes sync automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
