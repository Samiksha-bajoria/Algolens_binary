import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronDown } from 'lucide-react';
import { ALGORITHM_TEMPLATES } from '@/lib/interpreter';

interface CodeEditorProps {
  code: string;
  activeLine: number;
  isProMode: boolean;
  onCodeChange: (code: string) => void;
  onRun: () => void;
}

const KEYWORDS = ['function', 'let', 'const', 'var', 'return', 'if', 'else', 'while', 'for', 'of', 'in', 'new', 'this', 'true', 'false', 'null', 'undefined', 'break', 'continue'];

function highlightLine(code: string): string {
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // strings first
  result = result.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,
    '<span class="syn-str">$1</span>');
  // comments
  result = result.replace(/(\/\/.*)/g, '<span class="syn-cmt">$1</span>');
  // numbers (not inside strings)
  result = result.replace(/(?<![a-zA-Z_$])(\b\d+(?:\.\d+)?\b)/g, '<span class="syn-num">$1</span>');
  // keywords
  const kwRe = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g');
  result = result.replace(kwRe, '<span class="syn-kw">$1</span>');
  // functions
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="syn-fn">$1</span>');

  return result;
}

const CodeEditor = ({ code, activeLine, isProMode, onCodeChange, onRun }: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleCursorMove = useCallback(() => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      const line = code.substring(0, pos).split('\n').length;
      setCursorLine(line);
    }
  }, [code]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = textareaRef.current!;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newCode);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  }, [code, onCodeChange, onRun]);

  const lines = code.split('\n');

  return (
    <div className="glass h-full flex flex-col overflow-hidden">
      <style>{`
        .editor-line-content {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.65rem;
          white-space: pre;
        }
        .syn-kw  { color: hsl(263 70% 70%); font-weight: 600; }
        .syn-str { color: hsl(152 60% 55%); }
        .syn-num { color: hsl(38 92% 60%); }
        .syn-cmt { color: hsl(215 20% 45%); font-style: italic; }
        .syn-fn  { color: hsl(199 80% 60%); }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 bg-card/40">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground/60 ml-1 flex-1">playground.js</span>
        {isProMode && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">PRO</span>
        )}

        {/* Template picker */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted/30 hover:bg-muted/60 transition-colors"
          >
            Templates <ChevronDown size={10} />
          </button>
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                className="absolute right-0 top-full mt-1 z-50 glass border border-border rounded-lg py-1 min-w-[150px]"
              >
                {Object.keys(ALGORITHM_TEMPLATES).map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      onCodeChange(ALGORITHM_TEMPLATES[name]);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 relative overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '1.65rem' }}>
        {/* Syntax + highlight layer */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 overflow-hidden pointer-events-none select-none z-0"
          style={{ padding: '12px 12px 12px 56px' }}
        >
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === activeLine;
            const isCursor = lineNum === cursorLine;
            return (
              <div key={i} className="relative editor-line-content min-h-[1.65rem]">
                {/* Active execution line highlight */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="exec-line"
                      className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                      style={{ marginLeft: '-56px', width: 'calc(100% + 56px)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                {/* Cursor line highlight */}
                {isCursor && !isActive && (
                  <div
                    className="absolute inset-0 bg-muted/20"
                    style={{ marginLeft: '-56px', width: 'calc(100% + 56px)' }}
                  />
                )}
                {/* Line number */}
                <span
                  className="absolute text-right transition-colors duration-200"
                  style={{
                    left: '-48px', width: '36px',
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(215 20% 30%)',
                    fontWeight: isActive ? '600' : '400',
                    fontSize: '11px',
                  }}
                >
                  {lineNum}
                </span>
                {/* Syntax highlighted code */}
                <span
                  className="relative z-10"
                  style={{ color: isActive ? 'hsl(var(--foreground))' : 'hsl(210 40% 75%)' }}
                  dangerouslySetInnerHTML={{ __html: highlightLine(line || ' ') }}
                />
              </div>
            );
          })}
        </pre>

        {/* Invisible textarea for input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          onScroll={handleScroll}
          onSelect={handleCursorMove}
          onKeyDown={handleKeyDown}
          onKeyUp={handleCursorMove}
          onClick={handleCursorMove}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-primary outline-none resize-none z-10 overflow-auto"
          style={{ padding: '12px 12px 12px 56px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '1.65rem', whiteSpace: 'pre' }}
        />
      </div>

      {/* Footer: Run button */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-card/30">
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {lines.length} lines · ⌘↵ to run
        </span>
        <motion.button
          onClick={onRun}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-[11px] font-mono font-semibold hover:bg-primary/30 transition-all"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Play size={11} className="fill-current" />
          Run & Visualize
        </motion.button>
      </div>
    </div>
  );
};

export default CodeEditor;
