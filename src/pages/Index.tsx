// import { useState, useCallback, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Hexagon } from 'lucide-react';
// import CodeEditor from '@/components/CodeEditor';
// import TimelineControls from '@/components/TimelineControls';
// import ExecutionVisualizer from '@/components/ExecutionVisualizer';
// import ExecutionTree from '@/components/ExecutionTree';
// import VariablePanel from '@/components/VariablePanel';
// import ExplanationPanel from '@/components/ExplanationPanel';
// import ModeToggle from '@/components/ModeToggle';
// import { executionSteps } from '@/lib/mockData';

// const Index = () => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isProMode, setIsProMode] = useState(false);

//   const currentStepData = executionSteps[currentStep];

//   const handleStepForward = useCallback(() => {
//     setCurrentStep(s => Math.min(s + 1, executionSteps.length - 1));
//   }, []);

//   const handleStepBack = useCallback(() => {
//     setCurrentStep(s => Math.max(s - 1, 0));
//   }, []);

//   const handleTogglePlay = useCallback(() => {
//     setIsPlaying(p => !p);
//   }, []);

//   useEffect(() => {
//     if (!isPlaying) return;
//     const interval = setInterval(() => {
//       setCurrentStep(s => {
//         if (s >= executionSteps.length - 1) {
//           setIsPlaying(false);
//           return s;
//         }
//         return s + 1;
//       });
//     }, 1200);
//     return () => clearInterval(interval);
//   }, [isPlaying]);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.key === 'ArrowRight') handleStepForward();
//       if (e.key === 'ArrowLeft') handleStepBack();
//       if (e.key === ' ') { e.preventDefault(); handleTogglePlay(); }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, [handleStepForward, handleStepBack, handleTogglePlay]);

//   return (
//     <div className="h-screen flex flex-col bg-background gradient-mesh overflow-hidden">
//       {/* Header */}
//       <header className="flex items-center justify-between px-6 py-3 border-b border-border/50">
//         <div className="flex items-center gap-3">
//           <motion.div
//             animate={{ rotate: [0, 360] }}
//             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
//           >
//             <Hexagon size={24} className="text-primary" strokeWidth={1.5} />
//           </motion.div>
//           <h1 className="text-base font-semibold tracking-tight">
//             <span className="text-primary neon-text-blue">Algo</span>
//             <span className="text-foreground">Lens</span>
//           </h1>
//           <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 font-mono">
//             v1.0
//           </span>
//         </div>
//         <div className="flex items-center gap-4">
//           <ModeToggle isProMode={isProMode} onToggle={() => setIsProMode(!isProMode)} />
//           <span className="text-[10px] text-muted-foreground/50 font-mono hidden md:block">
//             ← → to step &nbsp;|&nbsp; Space to play
//           </span>
//         </div>
//       </header>

//       {/* Timeline */}
//       <div className="border-b border-border/50">
//         <TimelineControls
//           currentStep={currentStep}
//           isPlaying={isPlaying}
//           onStepChange={setCurrentStep}
//           onTogglePlay={handleTogglePlay}
//           onStepBack={handleStepBack}
//           onStepForward={handleStepForward}
//         />
//       </div>

//       {/* Main content */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* Left: Code Editor */}
//         <div className="w-[320px] min-w-[280px] border-r border-border/50 p-2">
//           <CodeEditor activeLine={currentStepData.line} isProMode={isProMode} />
//         </div>

//         {/* Center: Visualization + Tree */}
//         <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
//           <div className="flex-1 min-h-0">
//             <ExecutionVisualizer currentStepData={currentStepData} />
//           </div>
//           <div className="h-[260px] min-h-[200px]">
//             <ExecutionTree currentStepData={currentStepData} onJumpToStep={setCurrentStep} />
//           </div>
//         </div>

//         {/* Right: AI Panel */}
//         <div className="w-[300px] min-w-[260px] border-l border-border/50 p-2">
//           <ExplanationPanel
//             explanation={currentStepData.explanation}
//             whatIf={currentStepData.whatIf}
//             step={currentStep}
//             isProMode={isProMode}
//           />
//         </div>
//       </div>

//       {/* Bottom: Variables */}
//       <div className="border-t border-border/50 p-2">
//         <VariablePanel variables={currentStepData.variables} />
//       </div>
//     </div>
//   );
// };

// export default Index;
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Sparkles, AlertCircle } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import TimelineControls from '@/components/TimelineControls';
import ExecutionVisualizer from '@/components/ExecutionVisualizer';
import ExecutionTree from '@/components/ExecutionTree';
import VariablePanel from '@/components/VariablePanel';
import ExplanationPanel from '@/components/ExplanationPanel';
import ModeToggle from '@/components/ModeToggle';
import ProModeView from '@/components/ProModeView';
import { interpretCode, detectAlgorithm, ALGORITHM_TEMPLATES, type InterpreterResult } from '@/lib/interpreter';

const DEFAULT_CODE = ALGORITHM_TEMPLATES['Binary Search'];

// ─── Toast notification ───────────────────────────────────────────────────────
const Toast = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-xs z-50 ${
      type === 'success'
        ? 'bg-green-500/15 border-green-400/40 text-green-300'
        : 'bg-red-500/15 border-red-400/40 text-red-300'
    }`}
  >
    {type === 'error' && <AlertCircle size={13} />}
    {type === 'success' && <Sparkles size={13} />}
    {message}
  </motion.div>
);

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryMode = new URLSearchParams(location.search).get('mode');
  
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState<InterpreterResult>({ steps: [{ step: 1, line: 1, variables: [], explanation: 'Initializing...', action: 'Start', phase: 'init', activeElements: [], whatIf: '', treeHighlight: [] }], treeNodes: [], arrayData: [], algorithmType: 'generic' });
  const [isTracing, setIsTracing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Set Developer Mode implicitly if URL dictates it
  const [isProMode, setIsProMode] = useState(queryMode === 'developing');
  
  const [speed, setSpeed] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hasRun, setHasRun] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const playRef = useRef(isPlaying);
  playRef.current = isPlaying;

  // ── Cooldown Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const steps = result.steps;
  const currentStepData = steps[Math.min(currentStep, steps.length - 1)];

  // ── Run the interpreter ──────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    try {
      setIsTracing(true);
      const res = await interpretCode(code);
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
      setHasRun(true);
      setToast({ message: `✓ ${res.steps.length} steps generated — ${res.algorithmType.replace('-', ' ')}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      const msg = e.message || 'Unknown execution trace error.';
      if (msg.toLowerCase().includes('quota') || msg.includes('429')) {
        setCooldown(30);
      }
      setToast({ message: `Error: ${msg.substring(0, 100)}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsTracing(false);
    }
  }, [code]);

  // ── Auto-run on first mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    interpretCode(DEFAULT_CODE).then(res => {
      if (mounted) setResult(res);
    }).catch(e => console.error(e));
    return () => { mounted = false; };
  }, []);

  // ── Auto-run native algorithms on input change ────────────────────────────
  useEffect(() => {
    if (hasRun || detectAlgorithm(code) === 'generic') return;
    
    // Smooth 400ms debounce before interpreting native functions (avoids burning quota generic AI loops)
    const timer = setTimeout(() => {
      handleRun();
    }, 400);
    
    return () => clearTimeout(timer);
  }, [code, hasRun, handleRun]);

  // ── Step controls ────────────────────────────────────────────────────────
  const handleStepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  }, [steps.length]);

  const handleStepBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  // ── Auto-play timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const ms = Math.round(1200 / speed);
    const interval = setInterval(() => {
      setCurrentStep(s => {
        if (s >= steps.length - 1) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, ms);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, speed]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA') return; // don't steal from editor
      if (e.key === 'ArrowRight') { e.preventDefault(); handleStepForward(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleStepBack(); }
      if (e.key === ' ')          { e.preventDefault(); handleTogglePlay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleStepForward, handleStepBack, handleTogglePlay]);

  // ── Code changed indicator ───────────────────────────────────────────────
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setHasRun(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background gradient-mesh overflow-y-auto pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-border/40 bg-card/20 backdrop-blur-sm shrink-0">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <Hexagon size={22} className="text-primary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-sm font-bold tracking-tight">
            <span className="text-primary neon-text-blue">Algo</span>
            <span className="text-foreground">Lens</span>
          </h1>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-purple/15 text-neon-purple border border-neon-purple/25 font-mono">
            v2.0
          </span>
          <motion.span
            animate={{ opacity: hasRun ? 0 : [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[9px] font-mono text-amber-400/80 ml-1"
          >
            {!hasRun ? '● unsaved' : ''}
          </motion.span>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle isProMode={isProMode} onToggle={() => setIsProMode(!isProMode)} />
          <span className="text-[9px] text-muted-foreground/40 font-mono hidden lg:block">
            ← → step &nbsp;|&nbsp; Space play &nbsp;|&nbsp; ⌘↵ run
          </span>
        </div>
      </header>

      {isProMode ? (
        <ProModeView />
      ) : (
        <div className="flex flex-col max-w-[1600px] w-full mx-auto pb-8">
          {/* ── Timeline ───────────────────────────────────────────────────────── */}
          <div className="border-b border-border/40 shrink-0 relative">
            {isTracing && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 rounded-full text-xs font-mono text-primary shadow-lg animate-pulse">
                  <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  AI AST Tracing Pipeline Active...
                </div>
              </div>
            )}
            <TimelineControls
              currentStep={currentStep}
              totalSteps={steps.length}
              isPlaying={isPlaying}
              speed={speed}
              steps={steps}
              onStepChange={setCurrentStep}
              onStepForward={handleStepForward}
              onStepBack={handleStepBack}
              onTogglePlay={handleTogglePlay}
              onSpeedChange={setSpeed}
            />
          </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-4">
        {/* Top Row: Code Editor + Execution Tree (Side-by-Side) */}
        <div className="flex gap-4 h-[400px]">
          <div className="flex-1 border border-border/40 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <CodeEditor
              code={code}
              activeLine={currentStepData?.line ?? 1}
              isProMode={isProMode}
              onCodeChange={handleCodeChange}
              onRun={handleRun}
              isCooldown={cooldown > 0}
              cooldownTime={cooldown}
            />
          </div>
          {result?.algorithmType !== 'generic' && (
            <div className="w-[450px] border border-border/40 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <ExecutionTree
                currentStepData={currentStepData}
                treeNodes={result.treeNodes}
                onJumpToStep={setCurrentStep}
                algorithmType={result.algorithmType}
              />
            </div>
          )}
        </div>

        {/* Bottom Row: Visualization + AI Insights */}
        <div className="flex gap-4">
          {/* Main Visualization */}
          <div className="flex-1 min-h-[400px] border border-border/40 rounded-xl shadow-sm overflow-hidden bg-card/5">
            <ExecutionVisualizer
              currentStepData={currentStepData}
              algorithmType={result?.algorithmType}
              arrayData={currentStepData?.array || result?.arrayData}
              customFramerCode={result?.customFramerCode}
            />
          </div>

          {/* AI Insights Card */}
          <div className="w-[340px] shrink-0 flex flex-col border border-border/40 rounded-xl shadow-sm overflow-hidden bg-card/10">
            <ExplanationPanel
              currentStepData={currentStepData}
              totalSteps={steps.length}
              algorithmType={result.algorithmType}
              isProMode={isProMode}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom: Variables ──────────────────────────────────────────────── */}
      <div className="border border-border/40 rounded-xl mx-4 p-4 shadow-sm bg-card/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <VariablePanel variables={currentStepData?.variables ?? []} />
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
      )}

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
