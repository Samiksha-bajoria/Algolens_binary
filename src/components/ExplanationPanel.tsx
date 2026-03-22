import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, GitBranch, Sparkles, Clock, Cpu } from 'lucide-react';
import type { ExecutionStep } from '@/lib/interpreter';

interface ExplanationPanelProps {
  currentStepData: ExecutionStep;
  totalSteps: number;
  algorithmType: string;
  isProMode: boolean;
}

const complexityInfo: Record<string, { time: string; space: string; best: string; note: string }> = {
  'binary-search':  { time: 'O(log n)', space: 'O(1)',    best: 'O(1)',      note: 'Requires sorted array' },
  'bubble-sort':    { time: 'O(n²)',    space: 'O(1)',    best: 'O(n)',      note: 'Stable, in-place sort' },
  'fibonacci':      { time: 'O(2ⁿ)',   space: 'O(n)',    best: 'O(1)',      note: 'Use memoization for O(n)' },
  'factorial':      { time: 'O(n)',     space: 'O(n)',    best: 'O(n)',      note: 'Iterative uses O(1) space' },
  'linear-search':  { time: 'O(n)',     space: 'O(1)',    best: 'O(1)',      note: 'Works on unsorted arrays' },
  'generic':        { time: 'Varies',   space: 'Varies',  best: 'Varies',    note: 'Analyze case by case' },
};

const ExplanationPanel = ({ currentStepData, totalSteps, algorithmType, isProMode }: ExplanationPanelProps) => {
  const complexity = complexityInfo[algorithmType] || complexityInfo['generic'];
  const progress = Math.round(((currentStepData.step) / totalSteps) * 100);

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
        <Sparkles size={13} className="text-neon-purple" />
        <span className="text-xs font-semibold text-foreground/70 tracking-wider uppercase">AI Insights</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="h-1 w-16 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/40">{progress}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-3 space-y-3">
        {/* WHY */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`why-${currentStepData.step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="glass-subtle p-3 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                <Lightbulb size={11} className="text-primary" />
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Why</span>
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed">{currentStepData.explanation}</p>
          </motion.div>
        </AnimatePresence>

        {/* WHAT IF */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`wi-${currentStepData.step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: 0.07 }}
            className="glass-subtle p-3 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                <GitBranch size={11} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">What If</span>
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed">{currentStepData.whatIf}</p>
          </motion.div>
        </AnimatePresence>

        {/* Complexity info (Pro or always shown) */}
        <motion.div
          className="glass-subtle p-3 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
              <Cpu size={11} className="text-cyan-400" />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Complexity</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Time', val: complexity.time },
              { label: 'Space', val: complexity.space },
              { label: 'Best', val: complexity.best },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between px-2 py-1 rounded bg-muted/30">
                <span className="text-[9px] text-muted-foreground/50 font-mono">{label}</span>
                <span className="text-[10px] font-mono font-bold text-foreground/80">{val}</span>
              </div>
            ))}
          </div>
          {isProMode && (
            <p className="text-[9px] font-mono text-muted-foreground/50 pt-1 border-t border-border/30">
              💡 {complexity.note}
            </p>
          )}
        </motion.div>

        {/* Return value */}
        {currentStepData.returnValue !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-subtle p-3 border border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
                <Clock size={11} className="text-green-400" />
              </div>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Result</span>
            </div>
            <div className="mt-1.5 font-mono text-sm font-bold text-green-300">
              → {currentStepData.returnValue}
            </div>
          </motion.div>
        )}

        {/* Thinking indicator */}
        <motion.div
          className="flex items-center gap-2 px-2 py-1"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-neon-purple"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground/40 font-mono">analyzing...</span>
        </motion.div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
