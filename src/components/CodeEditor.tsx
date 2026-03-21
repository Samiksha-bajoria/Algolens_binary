import { motion, AnimatePresence } from 'framer-motion';
import { codeLines } from '@/lib/mockData';

interface CodeEditorProps {
  activeLine: number;
  isProMode: boolean;
}

const CodeEditor = ({ activeLine, isProMode }: CodeEditorProps) => {
  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-neon-red/80" />
          <div className="w-3 h-3 rounded-full bg-neon-amber/80" />
          <div className="w-3 h-3 rounded-full bg-neon-green/80" />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2">binarySearch.js</span>
        {isProMode && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
            PRO
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin p-0">
        <pre className="text-sm leading-relaxed">
          {codeLines.map((line, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === activeLine;
            return (
              <div key={i} className="relative">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="active-line"
                      className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{
                        boxShadow: '0 0 30px hsl(var(--neon-blue) / 0.1)',
                      }}
                    />
                  )}
                </AnimatePresence>
                <div className={`flex relative z-10 px-4 py-0.5 transition-colors duration-300 ${isActive ? '' : 'hover:bg-muted/30'}`}>
                  <span className={`w-8 text-right mr-4 select-none font-mono text-xs ${isActive ? 'text-primary neon-text-blue' : 'text-muted-foreground/50'}`}>
                    {lineNum}
                  </span>
                  <span className="font-mono text-xs">
                    <SyntaxLine code={line} isActive={isActive} />
                  </span>
                </div>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

const SyntaxLine = ({ code, isActive }: { code: string; isActive: boolean }) => {
  const highlighted = code
    .replace(/(function|let|const|return|if|else|while)/g, '<kw>$1</kw>')
    .replace(/(\d+)/g, '<num>$1</num>')
    .replace(/(\/\/.*)/g, '<cmt>$1</cmt>')
    .replace(/('.*?')/g, '<str>$1</str>');

  const parts = highlighted.split(/(<\/?(?:kw|num|cmt|str)>)/g);
  let currentTag = '';

  return (
    <span className={`transition-all duration-300 ${isActive ? 'text-foreground' : 'text-foreground/70'}`}>
      {parts.map((part, i) => {
        if (part === '<kw>') { currentTag = 'kw'; return null; }
        if (part === '<num>') { currentTag = 'num'; return null; }
        if (part === '<cmt>') { currentTag = 'cmt'; return null; }
        if (part === '<str>') { currentTag = 'str'; return null; }
        if (part.startsWith('</')) { currentTag = ''; return null; }

        const cls = currentTag === 'kw' ? 'text-neon-purple font-semibold'
          : currentTag === 'num' ? 'text-neon-amber'
          : currentTag === 'cmt' ? 'text-muted-foreground/50 italic'
          : currentTag === 'str' ? 'text-neon-green'
          : '';

        return <span key={i} className={cls}>{part}</span>;
      })}
    </span>
  );
};

export default CodeEditor;
