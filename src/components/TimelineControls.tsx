import { motion } from 'framer-motion';
import { SkipBack, Play, Pause, SkipForward, Rewind, FastForward, Zap } from 'lucide-react';
import type { ExecutionStep } from '@/lib/interpreter';
import React from 'react';

interface TimelineControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  steps: ExecutionStep[];
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2, 3];

const phaseColor: Record<string, string> = {
  init:    'bg-blue-400',
  compare: 'bg-purple-400',
  branch:  'bg-amber-400',
  update:  'bg-cyan-400',
  return:  'bg-green-400',
  done:    'bg-green-300',
};

const TimelineControls = ({
  currentStep, totalSteps, isPlaying, speed, steps,
  onStepChange, onTogglePlay, onStepBack, onStepForward, onSpeedChange,
}: TimelineControlsProps) => {
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const currentData = steps[currentStep];
  const nextSpeedIdx = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;

  return (
    <div className="glass px-5 py-2.5">
      <div className="flex items-center gap-3">
        {/* Step info */}
        <div className="flex items-center gap-2 min-w-[160px]">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: isPlaying ? [1, 1.5, 1] : 1, opacity: isPlaying ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0 }}
          />
          <span className="text-[11px] font-mono text-muted-foreground">
            Step <span className="text-primary font-bold">{currentStep + 1}</span>
            <span className="text-muted-foreground/50"> / {totalSteps}</span>
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <CtrlBtn onClick={() => onStepChange(0)} icon={<Rewind size={13} />} tip="Reset" />
          <CtrlBtn onClick={onStepBack} icon={<SkipBack size={13} />} tip="Back (←)" />

          {/* Play/Pause */}
          <motion.button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary hover:bg-primary/30 transition-all"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </motion.button>

          <CtrlBtn onClick={onStepForward} icon={<SkipForward size={13} />} tip="Forward (→)" />
          <CtrlBtn onClick={() => onStepChange(totalSteps - 1)} icon={<FastForward size={13} />} tip="End" />

          {/* Speed button */}
          <motion.button
            onClick={() => onSpeedChange(SPEEDS[nextSpeedIdx])}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-muted/40 border border-border text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/30 transition-all ml-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Change speed"
          >
            <Zap size={10} />
            {speed}x
          </motion.button>
        </div>

        {/* Timeline slider */}
        <div className="flex-1 relative group cursor-pointer" style={{ minWidth: 0 }}>
          <div className="h-1 bg-muted/60 rounded-full overflow-visible relative">
            {/* Filled progress */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />

            {/* Step markers */}
            {steps.map((s, i) => {
              const pct = totalSteps > 1 ? (i / (totalSteps - 1)) * 100 : 0;
              const dotColor = phaseColor[s.phase || 'init'] || 'bg-primary';
              return (
                <button
                  key={i}
                  onClick={() => onStepChange(i)}
                  title={s.action}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                  style={{ left: `${pct}%` }}
                >
                  <motion.div
                    className={`rounded-full transition-all duration-200 ${
                      i === currentStep
                        ? `w-3.5 h-3.5 ${dotColor} ring-2 ring-primary/30`
                        : i < currentStep
                        ? `w-2 h-2 ${dotColor} opacity-60`
                        : 'w-1.5 h-1.5 bg-muted-foreground/20 group-hover:bg-muted-foreground/40'
                    }`}
                    animate={i === currentStep ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Current action label */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] font-mono text-muted-foreground min-w-[140px] text-right truncate"
        >
          {currentData?.action}
        </motion.div>
      </div>
    </div>
  );
};

const CtrlBtn = ({ onClick, icon, tip }: { onClick: () => void; icon: React.ReactNode; tip: string }) => (
  <motion.button
    onClick={onClick}
    title={tip}
    className="w-7 h-7 rounded-md bg-muted/40 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/30 transition-all"
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.94 }}
  >
    {icon}
  </motion.button>
);

export default TimelineControls;
