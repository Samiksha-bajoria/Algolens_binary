import { motion } from 'framer-motion';
import type { ExecutionStep, TreeNode } from '@/lib/interpreter';

interface ExecutionTreeProps {
  currentStepData: ExecutionStep;
  treeNodes: TreeNode[];
  onJumpToStep: (step: number) => void;
  algorithmType: string;
}

const ExecutionTree = ({ currentStepData, treeNodes, onJumpToStep, algorithmType }: ExecutionTreeProps) => {
  const highlighted = currentStepData.treeHighlight;

  if (!treeNodes || treeNodes.length === 0) {
    return (
      <div className="glass h-full flex items-center justify-center">
        <span className="text-xs text-muted-foreground/40 font-mono">No tree data</span>
      </div>
    );
  }

  // Compute viewBox bounds from node positions
  const xs = treeNodes.map(n => n.x);
  const ys = treeNodes.map(n => n.y);
  const minX = Math.min(...xs) - 70;
  const maxX = Math.max(...xs) + 70;
  const minY = Math.min(...ys) - 10;
  const maxY = Math.max(...ys) + 40;
  const vw = Math.max(maxX - minX, 400);
  const vh = Math.max(maxY - minY, 150);

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">
          Execution Tree
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {algorithmType.replace('-', ' ')}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`${minX} ${minY} ${vw} ${vh}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Draw edges */}
          {treeNodes.map(node =>
            node.children.map(childId => {
              const child = treeNodes.find(n => n.id === childId);
              if (!child) return null;
              const isHighlighted = highlighted.includes(node.id) && highlighted.includes(childId);
              return (
                <motion.line
                  key={`${node.id}-${childId}`}
                  x1={node.x} y1={node.y + 14}
                  x2={child.x} y2={child.y - 2}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isHighlighted ? 1.5 : 0.8}
                  strokeOpacity={isHighlighted ? 0.7 : 0.25}
                  initial={false}
                  animate={{
                    stroke: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    strokeOpacity: isHighlighted ? 0.7 : 0.25,
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
            const isFound = node.label.includes('✓') || node.label.includes('Found');

            return (
              <g
                key={node.id}
                onClick={() => {
                  // Jump to a proportional step
                  const ratio = node.id / Math.max(treeNodes.length - 1, 1);
                  // Will be overridden by parent
                }}
                className="cursor-pointer"
              >
                <motion.rect
                  x={node.x - 48} y={node.y - 12}
                  width={96} height={24}
                  rx={6}
                  fill={
                    isFound ? 'hsl(var(--neon-green) / 0.15)'
                    : isLatest ? 'hsl(var(--primary) / 0.2)'
                    : isHighlighted ? 'hsl(var(--muted))'
                    : 'hsl(var(--card))'
                  }
                  stroke={
                    isFound ? 'hsl(var(--neon-green))'
                    : isLatest ? 'hsl(var(--primary))'
                    : isHighlighted ? 'hsl(var(--primary) / 0.35)'
                    : 'hsl(var(--border))'
                  }
                  strokeWidth={isLatest || isFound ? 1.5 : 0.8}
                  initial={false}
                  animate={{
                    fill: isFound ? 'hsl(var(--neon-green) / 0.15)'
                      : isLatest ? 'hsl(var(--primary) / 0.2)'
                      : isHighlighted ? 'hsl(var(--muted))'
                      : 'hsl(var(--card))',
                    scale: isLatest ? 1.06 : 1,
                  }}
                  transition={{ duration: 0.35 }}
                  style={isLatest ? { filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' } : undefined}
                />

                {/* Pulse ring on latest node */}
                {isLatest && (
                  <motion.rect
                    x={node.x - 48} y={node.y - 12}
                    width={96} height={24}
                    rx={6}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="text-[10px] font-mono select-none"
                  fill={
                    isFound ? 'hsl(var(--neon-green))'
                    : isHighlighted ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted-foreground) / 0.45)'
                  }
                  fontSize={10}
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
