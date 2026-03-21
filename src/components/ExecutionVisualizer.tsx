import { motion } from 'framer-motion';
import { searchArray, type ExecutionStep } from '@/lib/mockData';

interface ExecutionVisualizerProps {
  currentStepData: ExecutionStep;
}

const ExecutionVisualizer = ({ currentStepData }: ExecutionVisualizerProps) => {
  const maxVal = Math.max(...searchArray);
  const lowVar = currentStepData.variables.find(v => v.name === 'low');
  const highVar = currentStepData.variables.find(v => v.name === 'high');
  const midVar = currentStepData.variables.find(v => v.name === 'mid');

  const low = typeof lowVar?.value === 'number' ? lowVar.value : -1;
  const high = typeof highVar?.value === 'number' ? highVar.value : -1;
  const mid = typeof midVar?.value === 'number' ? midVar.value : -1;
  const isFound = currentStepData.step === 13;

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          Array Visualization
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20">
          Binary Search
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Array bars */}
        <div className="flex items-end gap-2 h-40">
          {searchArray.map((val, i) => {
            const height = (val / maxVal) * 120 + 20;
            const isActive = currentStepData.activeElements.includes(i);
            const isMid = i === mid;
            const isInRange = i >= low && i <= high;
            const isFoundIdx = isFound && i === mid;

            let barColor = 'bg-muted/40';
            let borderColor = 'border-border';
            let glow = '';

            if (isFoundIdx) {
              barColor = 'bg-neon-green/40';
              borderColor = 'border-neon-green/60';
              glow = 'neon-glow-green';
            } else if (isMid) {
              barColor = 'bg-primary/30';
              borderColor = 'border-primary/60';
              glow = 'neon-glow-blue';
            } else if (isActive) {
              barColor = 'bg-neon-purple/20';
              borderColor = 'border-neon-purple/40';
            } else if (isInRange) {
              barColor = 'bg-muted/60';
              borderColor = 'border-border';
            }

            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <motion.div
                  className={`w-10 rounded-t-md border ${barColor} ${borderColor} ${glow} relative transition-colors duration-300`}
                  animate={{
                    height,
                    opacity: isInRange || isActive || isMid ? 1 : 0.3,
                    scale: isMid ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <motion.span
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono font-semibold"
                    animate={{
                      color: isFoundIdx ? 'hsl(var(--neon-green))' : isMid ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {val}
                  </motion.span>
                </motion.div>
                {/* Index label */}
                <span className="text-[10px] font-mono text-muted-foreground/50">{i}</span>
                {/* Pointer labels */}
                <div className="h-4 flex flex-col items-center">
                  {i === low && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] font-mono font-bold text-neon-blue neon-text-blue"
                    >
                      low
                    </motion.span>
                  )}
                  {i === mid && mid !== low && mid !== high && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] font-mono font-bold text-neon-purple neon-text-purple"
                    >
                      mid
                    </motion.span>
                  )}
                  {i === high && high !== low && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] font-mono font-bold text-neon-amber"
                    >
                      high
                    </motion.span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Mid pointer</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-green" /> Found</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted/60 border border-border" /> In range</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted/20" /> Eliminated</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionVisualizer;
