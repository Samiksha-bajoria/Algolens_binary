import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import TimelineControls from '@/components/TimelineControls';
import ExecutionVisualizer from '@/components/ExecutionVisualizer';
import ExecutionTree from '@/components/ExecutionTree';
import VariablePanel from '@/components/VariablePanel';
import ExplanationPanel from '@/components/ExplanationPanel';
import ModeToggle from '@/components/ModeToggle';
import { executionSteps } from '@/lib/mockData';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProMode, setIsProMode] = useState(false);

  const currentStepData = executionSteps[currentStep];

  const handleStepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, executionSteps.length - 1));
  }, []);

  const handleStepBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep(s => {
        if (s >= executionSteps.length - 1) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleStepForward();
      if (e.key === 'ArrowLeft') handleStepBack();
      if (e.key === ' ') { e.preventDefault(); handleTogglePlay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleStepForward, handleStepBack, handleTogglePlay]);

  return (
    <div className="h-screen flex flex-col bg-background gradient-mesh overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Hexagon size={24} className="text-primary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-base font-semibold tracking-tight">
            <span className="text-primary neon-text-blue">Algo</span>
            <span className="text-foreground">Lens</span>
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 font-mono">
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle isProMode={isProMode} onToggle={() => setIsProMode(!isProMode)} />
          <span className="text-[10px] text-muted-foreground/50 font-mono hidden md:block">
            ← → to step &nbsp;|&nbsp; Space to play
          </span>
        </div>
      </header>

      {/* Timeline */}
      <div className="border-b border-border/50">
        <TimelineControls
          currentStep={currentStep}
          isPlaying={isPlaying}
          onStepChange={setCurrentStep}
          onTogglePlay={handleTogglePlay}
          onStepBack={handleStepBack}
          onStepForward={handleStepForward}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-[320px] min-w-[280px] border-r border-border/50 p-2">
          <CodeEditor activeLine={currentStepData.line} isProMode={isProMode} />
        </div>

        {/* Center: Visualization + Tree */}
        <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
          <div className="flex-1 min-h-0">
            <ExecutionVisualizer currentStepData={currentStepData} />
          </div>
          <div className="h-[260px] min-h-[200px]">
            <ExecutionTree currentStepData={currentStepData} onJumpToStep={setCurrentStep} />
          </div>
        </div>

        {/* Right: AI Panel */}
        <div className="w-[300px] min-w-[260px] border-l border-border/50 p-2">
          <ExplanationPanel
            explanation={currentStepData.explanation}
            whatIf={currentStepData.whatIf}
            step={currentStep}
            isProMode={isProMode}
          />
        </div>
      </div>

      {/* Bottom: Variables */}
      <div className="border-t border-border/50 p-2">
        <VariablePanel variables={currentStepData.variables} />
      </div>
    </div>
  );
};

export default Index;
