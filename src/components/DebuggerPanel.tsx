import React from "react";
import { Play, StepForward, RotateCcw, Bug, Terminal } from "lucide-react";
import { cn } from "../lib/utils";

interface DebuggerPanelProps {
  steps: any[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function DebuggerPanel({ steps, currentStepIndex, onStepChange, onReset, isLoading }: DebuggerPanelProps) {
  const currentStep = steps[currentStepIndex];

  return (
    <div className="bg-[#1A1A1A] rounded-3xl border border-[#333] shadow-xl flex flex-col h-full overflow-hidden text-gray-300">
      <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#222]">
        <div className="flex items-center gap-2 text-[#4F46E5]">
          <Bug size={18} />
          <h3 className="font-bold text-sm text-white">Debugger</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onReset}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors text-gray-400"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={() => onStepChange(currentStepIndex + 1)}
            disabled={isLoading || currentStepIndex >= steps.length - 1}
            className="flex items-center gap-2 bg-[#4F46E5] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4338CA] disabled:opacity-50 transition-all"
          >
            <StepForward size={14} />
            Step
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {steps.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50">
            <Terminal size={32} />
            <p className="text-xs">Run "Debug" to start stepping through your code.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {currentStep && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Current Line</h4>
              <div className="bg-[#222] p-2 rounded-lg border border-[#333] font-mono text-sm text-[#4F46E5]">
                Line {currentStep.line}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Variables</h4>
              <div className="space-y-2">
                {(!currentStep.locals || Object.entries(currentStep.locals).length === 0) ? (
                  <p className="text-xs italic text-gray-600">No variables in scope</p>
                ) : (
                  Object.entries(currentStep.locals).map(([name, value]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between bg-[#222] p-2 rounded-lg border border-[#333] font-mono text-xs">
                      <span className="text-blue-400">{name}</span>
                      <span className="text-gray-400">=</span>
                      <span className="text-green-400">{JSON.stringify(value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {currentStep.error && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-xl">
                <p className="text-xs text-red-400 font-mono">{currentStep.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-[#222] border-t border-[#333] flex items-center justify-between text-[10px] text-gray-500">
        <span>Step {steps.length > 0 ? currentStepIndex + 1 : 0} of {steps.length}</span>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1 h-1 rounded-full",
                i === currentStepIndex ? "bg-[#4F46E5]" : "bg-[#333]"
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
