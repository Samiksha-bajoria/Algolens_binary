import { motion } from 'framer-motion';
import { treeNodes, type ExecutionStep } from '@/lib/mockData';

interface ExecutionTreeProps {
  currentStepData: ExecutionStep;
  onJumpToStep: (step: number) => void;
}

const stepMapping: Record<number, number> = {
  0: 0, 1: 2, 2: 4, 3: 4, 4: 5, 5: 4, 6: 8, 7: 12,
};

const ExecutionTree = ({ currentStepData, onJumpToStep }: ExecutionTreeProps) => {
  const highlighted = currentStepData.treeHighlight;

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          Execution Tree
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <svg className="w-full h-full" viewBox="0 0 700 260" preserveAspectRatio="xMidYMid meet">
          {/* Draw edges */}
          {treeNodes.map(node =>
            node.children.map(childId => {
              const child = treeNodes[childId];
              const isHighlighted = highlighted.includes(node.id) && highlighted.includes(childId);
              return (
                <motion.line
                  key={`${node.id}-${childId}`}
                  x1={node.x} y1={node.y + 18}
                  x2={child.x} y2={child.y}
                  stroke={isHighlighted ? 'hsl(var(--neon-blue))' : 'hsl(var(--border))'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.8 : 0.3}
                  initial={false}
                  animate={{
                    stroke: isHighlighted ? 'hsl(var(--neon-blue))' : 'hsl(var(--border))',
                    strokeOpacity: isHighlighted ? 0.8 : 0.3,
                  }}
                  transition={{ duration: 0.4 }}
                />
              );
            })
          )}

          {/* Draw nodes */}
          {treeNodes.map(node => {
            const isHighlighted = highlighted.includes(node.id);
            const isLatest = highlighted.length > 0 && node.id === highlighted[highlighted.length - 1];
            const targetStep = stepMapping[node.id] ?? 0;

            return (
              <g key={node.id} onClick={() => onJumpToStep(targetStep)} className="cursor-pointer">
                <motion.rect
                  x={node.x - 50} y={node.y - 2}
                  width={100} height={24}
                  rx={6}
                  fill={isLatest ? 'hsl(var(--primary) / 0.2)' : isHighlighted ? 'hsl(var(--muted))' : 'hsl(var(--card))'}
                  stroke={isLatest ? 'hsl(var(--primary))' : isHighlighted ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}
                  strokeWidth={isLatest ? 2 : 1}
                  initial={false}
                  animate={{
                    fill: isLatest ? 'hsl(var(--primary) / 0.2)' : isHighlighted ? 'hsl(var(--muted))' : 'hsl(var(--card))',
                    scale: isLatest ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                />
                {isLatest && (
                  <motion.rect
                    x={node.x - 50} y={node.y - 2}
                    width={100} height={24}
                    rx={6}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <text
                  x={node.x} y={node.y + 14}
                  textAnchor="middle"
                  className="text-[11px] font-mono"
                  fill={isHighlighted ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.5)'}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ExecutionTree;
