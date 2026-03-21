import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, GitBranch, Sparkles } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: string;
  whatIf: string;
  step: number;
  isProMode: boolean;
}

const ExplanationPanel = ({ explanation, whatIf, step, isProMode }: ExplanationPanelProps) => {
  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles size={14} className="text-neon-purple" />
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          AI Insights
        </span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
        {/* WHY section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`why-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="glass-subtle p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <Lightbulb size={12} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Why</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{explanation}</p>
            {isProMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pt-2 border-t border-border mt-2"
              >
                <p className="text-[10px] text-muted-foreground font-mono">
                  // Binary search eliminates half the remaining elements each iteration → O(log n)
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* WHAT IF section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`whatif-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-subtle p-4 space-y-2 border-neon-amber/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-neon-amber/20 flex items-center justify-center">
                <GitBranch size={12} className="text-neon-amber" />
              </div>
              <span className="text-xs font-semibold text-neon-amber uppercase tracking-wider">What If</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{whatIf}</p>
          </motion.div>
        </AnimatePresence>

        {/* AI thinking indicator */}
        <motion.div
          className="flex items-center gap-2 px-3 py-2"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-neon-purple"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground/50 font-mono">AI analyzing execution flow...</span>
        </motion.div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
