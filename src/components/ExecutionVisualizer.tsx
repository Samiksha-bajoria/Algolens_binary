import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import type { ExecutionStep, InterpreterResult } from '@/lib/interpreter';
import StoryVisualizer from './StoryVisualizer';
import DynamicVisualizer from './DynamicVisualizer';

interface ExecutionVisualizerProps {
  currentStepData: ExecutionStep;
  algorithmType?: InterpreterResult['algorithmType'];
  arrayData?: number[];
  customFramerCode?: string;
}

const roleColors = {
  low:       { bar: 'bg-blue-500/30 border-blue-400/60',     label: 'text-blue-400',   dot: 'bg-blue-400',   glow: '0 0 16px rgba(59,130,246,0.4)' },
  high:      { bar: 'bg-amber-500/30 border-amber-400/60',   label: 'text-amber-400',  dot: 'bg-amber-400',  glow: '0 0 16px rgba(245,158,11,0.4)' },
  mid:       { bar: 'bg-primary/30 border-primary/60',       label: 'text-primary',    dot: 'bg-primary',    glow: '0 0 20px hsl(var(--neon-blue)/0.5)' },
  found:     { bar: 'bg-green-500/40 border-green-400/70',   label: 'text-green-400',  dot: 'bg-green-400',  glow: '0 0 24px rgba(34,197,94,0.5)' },
  comparing: { bar: 'bg-purple-500/30 border-purple-400/60', label: 'text-purple-400', dot: 'bg-purple-400', glow: '0 0 16px rgba(168,85,247,0.4)' },
  swapping:  { bar: 'bg-orange-500/40 border-orange-400/70', label: 'text-orange-400', dot: 'bg-orange-400', glow: '0 0 20px rgba(249,115,22,0.5)' },
};

// Call stack visualization for recursive algorithms
const CallStack = ({ callStack }: { callStack: string[] }) => {
  if (!callStack || callStack.length === 0) return null;
  return (
    <div className="flex flex-col-reverse gap-0.5">
      {callStack.slice(-6).map((frame, i) => (
        <motion.div
          key={`${frame}-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`px-2 py-1 rounded text-[10px] font-mono border ${
            i === callStack.length - 1
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-muted/40 border-border/50 text-muted-foreground/70'
          }`}
          style={{ marginLeft: i * 8 }}
        >
          {frame}
        </motion.div>
      ))}
      <div className="text-[9px] text-muted-foreground/40 font-mono mb-1">call stack</div>
    </div>
  );
};

// Array bar chart visualization
const ArrayVisualization = ({
  arrayData,
  currentStepData,
  algorithmType,
}: {
  arrayData: number[];
  currentStepData: ExecutionStep;
  algorithmType: string;
}) => {
  const maxVal = Math.max(...(arrayData || [1]).map(v => Number(v) || 1), 1);
  const highlighted = currentStepData.highlightedIndices || [];
  const roleMap = new Map(highlighted.map(h => [h.index, h.role]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2 h-36 justify-center flex-wrap">
        <AnimatePresence mode="popLayout">
          {arrayData.map((valRaw, i) => {
            const val = Math.round(Number(valRaw)) || 0;
            const role = roleMap.get(i);
            const isInActive = currentStepData.activeElements?.includes(i) ?? false;
            const height = Math.max((val / maxVal) * 100, 8) || 8;
            const colors = role ? roleColors[role] : null;

            return (
              <motion.div
                key={i}
                layout
                layoutId={`bar-${i}`}
                className={`flex flex-col items-center gap-1 ${
                  algorithmType === 'merge-sort' && currentStepData.phase === 'branch' && i === Math.floor(arrayData.length / 2) ? 'ml-8' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
  role === 'swapping'
    ? {
        layout: {
          type: 'spring',
          stiffness: 500,   // 🔥 stronger movement
          damping: 25
        }
      }
    : {
        layout: {
          type: 'spring',
          stiffness: 200,
          damping: 20
        },
        delay: i * 0.02
      }
}
              >
                {/* Value label above bar */}
                <motion.span
                  className="text-[10px] font-mono font-bold"
                  animate={{
                    color: colors ? (role === 'found' ? '#4ade80' : role === 'swapping' ? '#fb923c' : 'hsl(var(--primary))') : 'hsl(215 20% 50%)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {val}
                </motion.span>

                {/* Bar */}
                <motion.div
                  className={`w-8 rounded-t-md border-2 relative transition-colors duration-300 ${
                    colors ? colors.bar : isInActive ? 'bg-muted/50 border-border' : 'bg-muted/20 border-border/30'
                  }`}
                  animate={{
  height: `${height}px`,
  opacity: isInActive || role ? 1 : 0.35,

  // 🔥 SWAP EFFECT
  y: role === 'swapping' ? [0, -25, 0] : 0,
  x: role === 'swapping' ? [0, i % 2 === 0 ? 20 : -20, 0] : 0,

  scale:
    role === 'mid' || role === 'found'
      ? 1.06
      : role === 'swapping'
      ? [1, 1.15, 1]
      : 1,
}}
                  style={colors ? { boxShadow: colors.glow } : undefined}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                >
                  {/* Inner Lock (Bubble Sort / Sorted) */}
                  {role === 'found' && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                      className="absolute inset-x-0 bottom-2 flex justify-center text-green-900/50"
                    >
                      <Lock size={10} />
                    </motion.div>
                  )}
                </motion.div>

                {/* Index label */}
                <span className="text-[9px] font-mono text-muted-foreground/40">{i}</span>

                {/* Pointer label / Crown */}
                <div className="h-5 flex items-center justify-center mt-0.5">
                  {role === 'mid' && (algorithmType === 'generic' || algorithmType.includes('quick')) ? (
                    <motion.div initial={{ scale: 0, y: -5 }} animate={{ scale: 1, y: 0 }} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                      <Crown size={16} fill="currentColor" />
                    </motion.div>
                  ) : role && role !== 'found' ? (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[9px] font-mono font-bold ${colors!.label}`}
                    >
                      {role}
                    </motion.span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap justify-center text-[9px] text-muted-foreground/60">
        {Object.entries(roleColors).map(([role, c]) => (
          <span key={role} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {role}
          </span>
        ))}
      </div>
    </div>
  );
};

// Phase badge
const PhaseBadge = ({ phase }: { phase?: ExecutionStep['phase'] }) => {
  const config: Record<NonNullable<ExecutionStep['phase']>, { label: string; cls: string }> = {
    init:    { label: 'INIT',    cls: 'bg-blue-500/15 text-blue-400 border-blue-400/30' },
    compare: { label: 'COMPARE', cls: 'bg-purple-500/15 text-purple-400 border-purple-400/30' },
    branch:  { label: 'BRANCH',  cls: 'bg-amber-500/15 text-amber-400 border-amber-400/30' },
    update:  { label: 'UPDATE',  cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30' },
    return:  { label: 'RETURN',  cls: 'bg-green-500/15 text-green-400 border-green-400/30' },
    done:    { label: 'DONE',    cls: 'bg-green-500/20 text-green-300 border-green-400/40' },
  };
  if (!phase) return null;
  const { label, cls } = config[phase];
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold ${cls}`}>
      {label}
    </span>
  );
};

const ExecutionVisualizer = ({ currentStepData, algorithmType, arrayData, customFramerCode }: ExecutionVisualizerProps) => {
  if (algorithmType === 'story') {
    return <StoryVisualizer event={currentStepData.storyEvent} />;
  }
  
  if (algorithmType === 'generic') {
    // Escalate pure generic code arrays into the AI transpiler bindings immediately.
    return <DynamicVisualizer codeStr={customFramerCode} />;
  }

  const isRecursive = algorithmType === 'fibonacci' || algorithmType === 'factorial';
  const hasArray = arrayData && arrayData.length > 0;
  const hasCallStack = currentStepData.callStack && currentStepData.callStack.length > 0;

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          {isRecursive ? 'Recursion Visualizer' : hasArray ? 'Array Visualization' : 'Execution State'}
        </span>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={currentStepData.phase} />
          {currentStepData.returnValue !== undefined && (
            <motion.span
              key={currentStepData.returnValue}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-400/30 font-mono"
            >
              → {currentStepData.returnValue}
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main visualization area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-auto">
          <AnimatePresence mode="wait">
            {hasArray && (
              <motion.div
                key="array-viz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <ArrayVisualization
                  arrayData={arrayData}
                  currentStepData={currentStepData}
                  algorithmType={algorithmType}
                />
              </motion.div>
            )}

            {isRecursive && !hasArray && (
              <motion.div
                key="recursive-viz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2 w-full"
              >
                {/* Recursion depth visualization */}
                <div className="flex flex-col gap-1.5 w-full max-w-xs">
                  {(currentStepData.callStack || []).slice(0, 8).map((frame, i, arr) => (
                    <motion.div
                      key={`${frame}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-xs ${
                        i === arr.length - 1
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-muted/30 border-border/40 text-muted-foreground/70'
                      }`}
                      style={{ marginLeft: `${i * 16}px`, maxWidth: `calc(100% - ${i * 16}px)` }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${i === arr.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      {frame}
                      {i === arr.length - 1 && currentStepData.returnValue && (
                        <span className="ml-auto text-green-400">→ {currentStepData.returnValue}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground/40 font-mono mt-2">
                  Depth: {(currentStepData.callStack || []).length}
                </div>
              </motion.div>
            )}

            {!hasArray && !isRecursive && (
              <motion.div
                key="generic-viz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center"
                  animate={{ rotate: currentStepData.phase === 'compare' ? [0, 5, -5, 0] : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-2xl font-mono font-bold text-primary">
                    {currentStepData.step}
                  </span>
                </motion.div>
                <p className="text-xs text-muted-foreground/70 font-mono max-w-xs">
                  {currentStepData.action}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Call stack sidebar for recursive algorithms */}
        {isRecursive && !hasArray && hasCallStack && (
          <div className="w-36 border-l border-border/40 p-3 flex flex-col justify-end">
            <CallStack callStack={currentStepData.callStack || []} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionVisualizer;
