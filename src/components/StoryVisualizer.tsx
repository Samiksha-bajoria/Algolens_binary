import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoryEvent } from '@/lib/interpreter';
import Variable from './story/Variable';
import IfBlock from './story/IfBlock';
import Speech from './story/Speech';

export const StoryVisualizer = ({ event }: { event?: StoryEvent }) => {
  if (!event) return null;

  const renderScene = () => {
    switch (event.type) {
      case 'declare':
      case 'assign':
        return <Variable name={event.varName || ''} value={event.value} />;

      case 'if':
        return <IfBlock condition={event.condition || ''} result={!!event.pathSelected} />;

      case 'print':
        return <Speech text={String(event.value)} />;
      
      case 'loop_start':
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-8xl drop-shadow-xl">
            🌀
          </motion.div>
        );

      case 'loop_end':
        return <div className="text-6xl grayscale opacity-50">🛑</div>;

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#0A0A0A] relative text-white">
      
      <h1 className="absolute top-6 left-8 text-2xl font-bold text-white/50 flex items-center gap-3">
        <span className="text-blue-500">⚡</span> AlgoLens Story Mode
      </h1>

      <AnimatePresence mode="wait">
        <motion.div
           key={event.id}
           initial={{ opacity: 0, scale: 0.8, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
           transition={{ duration: 0.4 }}
           className="flex-1 flex flex-col items-center justify-center h-full w-full pb-20"
        >
          {renderScene()}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl text-lg font-medium tracking-wide border border-gray-700 w-[80%] text-center max-w-3xl">
         {event.narration}
      </div>
    </div>
  );
};

export default StoryVisualizer;
