import { motion, AnimatePresence } from 'framer-motion';
import type { Variable } from '@/lib/interpreter';

interface VariablePanelProps {
  variables: Variable[];
}

const typeColor = (val: Variable['value']): string => {
  if (typeof val === 'number') return 'text-amber-400';
  if (typeof val === 'boolean') return 'text-blue-400';
  if (val === null || val === 'null' || val === undefined) return 'text-muted-foreground/40';
  if (typeof val === 'string' && val.startsWith('[')) return 'text-cyan-400';
  return 'text-foreground';
};

const VariablePanel = ({ variables }: VariablePanelProps) => {
  return (
    <div className="glass px-4 py-3">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[10px] font-semibold text-foreground/60 tracking-widest uppercase">
          Variable State
        </span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[9px] font-mono text-muted-foreground/30">
          {variables.length} vars
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {variables.map(v => (
            <motion.div
              key={v.name}
              layout
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className={`glass-subtle px-3 py-2 flex items-center gap-2 min-w-[110px] ${
                v.changed ? 'border-primary/50 neon-glow-blue' : ''
              }`}
            >
              {/* Name */}
              <span className="text-[11px] font-mono font-semibold text-neon-purple">{v.name}</span>
              <span className="text-muted-foreground/30 text-xs">=</span>

              {/* Values */}
              <div className="flex items-center gap-1.5 overflow-hidden">
                {/* Crossed-out previous value */}
                {v.changed && v.prevValue !== undefined && (
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0.3 }}
                    className="text-[10px] font-mono text-red-400/70 line-through shrink-0"
                  >
                    {String(v.prevValue)}
                  </motion.span>
                )}

                {/* Current value */}
                <motion.span
                  key={`${v.name}-${String(v.value)}`}
                  initial={v.changed ? { opacity: 0, y: -6, scale: 1.2 } : {}}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`text-sm font-mono font-bold truncate max-w-[80px] ${
                    v.changed ? 'text-green-400' : typeColor(v.value)
                  }`}
                >
                  {String(v.value)}
                </motion.span>
              </div>

              {/* Changed indicator dot */}
              {v.changed && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {variables.length === 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/30">
            No variables in scope
          </span>
        )}
      </div>
    </div>
  );
};

export default VariablePanel;
