import React, { useMemo } from 'react';
import * as BabelObj from '@babel/standalone';
import { motion, AnimatePresence } from 'framer-motion';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/50 text-red-400 font-mono w-full h-full text-center">
          <div className="text-3xl mb-4">⚠️ JSX Runtime Collision</div>
          <div className="text-sm max-w-xl text-balance opacity-80 whitespace-pre-wrap">{String(this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DynamicVisualizer({ codeStr }: { codeStr?: string }) {
  const Component = useMemo(() => {
    if (!codeStr) return () => <div className="flex h-full w-full items-center justify-center text-muted-foreground animate-pulse font-mono tracking-widest uppercase">Building Execution Vectors...</div>;

    try {
      // Clean up any extraneous returns the AI might accidentally leave protecting Babel parse
      const safeCode = codeStr.replace(/^\s*return\s+[a-zA-Z0-9_]+\s*;/gm, '');
      
      // Use explicit availablePresets dict mapping tracking module root correctly explicitly enabling TSX resolution
      const babelInstance: any = (BabelObj as any).default || BabelObj;
      const transpiled = babelInstance.transform(safeCode, { 
        filename: 'dynamic.tsx',
        presets: ['react', 'typescript'] 
      }).code;

      const createComponent = new Function(
        'React', 'useState', 'useEffect', 'motion', 'AnimatePresence',
        `
          ${transpiled}
          
          if (typeof Visualizer !== 'undefined') return Visualizer;
          if (typeof DynamicVisualizer !== 'undefined') return DynamicVisualizer;
          if (typeof App !== 'undefined') return App;
          
          const keys = Object.keys(this || {});
          for (const key of keys) {
            if (typeof this[key] === 'function') return this[key];
          }
          return () => <div className="text-amber-500 font-mono">Unrecognized Component Export Format</div>;
        `
      );

      return createComponent.call({}, React, React.useState, React.useEffect, motion, AnimatePresence);
    } catch (e: any) {
      console.error("Transpilation Fault:", e);
      return () => (
        <div className="flex flex-col items-center justify-center p-8 bg-red-900/10 text-red-500 font-mono w-full h-full text-center">
          <div className="text-3xl mb-4">⚠️ Compiler Fatal Error</div>
          <div className="text-sm max-w-xl text-balance opacity-80">{String(e)}</div>
        </div>
      );
    }
  }, [codeStr]);

  if (!Component) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0A0A0F] rounded-xl flex items-center justify-center">
      <h1 className="absolute top-4 left-6 text-sm font-bold text-white/20 uppercase tracking-widest flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span> Live Evaluation Sandbox
      </h1>

      <div className="w-full h-full flex flex-col items-center justify-center inset-0 p-8 pt-12 text-white overflow-auto">
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      </div>
    </div>
  );
}
