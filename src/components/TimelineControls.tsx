import { motion } from 'framer-motion';
import { SkipBack, Play, Pause, SkipForward, Rewind, FastForward } from 'lucide-react';
import { executionSteps } from '@/lib/mockData';

interface TimelineControlsProps {
  currentStep: number;
  isPlaying: boolean;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

const TimelineControls = ({
  currentStep, isPlaying, onStepChange, onTogglePlay, onStepBack, onStepForward,
}: TimelineControlsProps) => {
  const totalSteps = executionSteps.length;
  const progress = ((currentStep) / (totalSteps - 1)) * 100;
  const currentData = executionSteps[currentStep];

  return (
    <div className="glass px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Step info */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: isPlaying ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
          />
          <span className="text-xs font-mono text-muted-foreground">
            Step <span className="text-primary font-semibold">{currentStep + 1}</span> of {totalSteps}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Time Travel
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <ControlButton onClick={() => onStepChange(0)} icon={<Rewind size={14} />} tooltip="Reset" />
          <ControlButton onClick={onStepBack} icon={<SkipBack size={14} />} tooltip="Step Back" />
          <motion.button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </motion.button>
          <ControlButton onClick={onStepForward} icon={<SkipForward size={14} />} tooltip="Step Forward" />
          <ControlButton onClick={() => onStepChange(totalSteps - 1)} icon={<FastForward size={14} />} tooltip="End" />
        </div>

        {/* Timeline slider */}
        <div className="flex-1 relative group">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
            {/* Step markers */}
            {executionSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200"
                style={{ left: `${(i / (totalSteps - 1)) * 100}%` }}
              >
                <motion.div
                  className={`rounded-full transition-colors duration-300 ${
                    i === currentStep
                      ? 'w-3.5 h-3.5 bg-primary neon-glow-blue'
                      : i < currentStep
                      ? 'w-2 h-2 bg-primary/60 group-hover:bg-primary/80'
                      : 'w-1.5 h-1.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                  }`}
                  animate={i === currentStep ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action label */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-mono text-muted-foreground min-w-[160px] text-right truncate"
        >
          {currentData?.action}
        </motion.div>
      </div>
    </div>
  );
};

const ControlButton = ({ onClick, icon, tooltip }: { onClick: () => void; icon: React.ReactNode; tooltip: string }) => (
  <motion.button
    onClick={onClick}
    title={tooltip}
    className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/30 transition-all"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon}
  </motion.button>
);

export default TimelineControls;
