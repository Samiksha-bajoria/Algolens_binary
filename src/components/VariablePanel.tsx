import { motion, AnimatePresence } from 'framer-motion';
import type { Variable } from '@/lib/mockData';

interface VariablePanelProps {
  variables: Variable[];
}

const VariablePanel = ({ variables }: VariablePanelProps) => {
  return (
    <div className="glass px-4 py-3">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          Variable State
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <AnimatePresence mode="popLayout">
          {variables.map((v) => (
            <motion.div
              key={v.name}
              layout
              className={`glass-subtle px-4 py-2.5 flex items-center gap-3 min-w-[140px] ${
                v.changed ? 'border-primary/40 neon-glow-blue' : ''
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-xs font-mono font-semibold text-neon-purple">{v.name}</span>
              <span className="text-muted-foreground/40">=</span>
              <div className="flex items-center gap-1.5">
                {v.changed && v.prevValue !== undefined && (
                  <motion.span
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 0.3, x: -4 }}
                    className="text-xs font-mono text-neon-red/60 line-through"
                  >
                    {String(v.prevValue)}
                  </motion.span>
                )}
                <motion.span
                  key={`${v.name}-${v.value}`}
                  initial={v.changed ? { opacity: 0, scale: 1.3, y: -4 } : {}}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`text-sm font-mono font-bold ${
                    v.changed ? 'text-neon-green neon-text-green' : 'text-foreground'
                  }`}
                >
                  {String(v.value)}
                </motion.span>
              </div>
              {v.changed && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-green"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VariablePanel;
