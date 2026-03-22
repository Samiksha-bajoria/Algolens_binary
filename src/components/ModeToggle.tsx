import { motion } from 'framer-motion';

interface ModeToggleProps {
  isProMode: boolean;
  onToggle: () => void;
}

const ModeToggle = ({ isProMode, onToggle }: ModeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 glass-subtle px-3 py-1.5 hover:border-primary/30 transition-all"
    >
      <div className="relative w-8 h-4 rounded-full bg-muted">
        <motion.div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-primary"
          animate={{ left: isProMode ? 16 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span className={`text-[10px] font-mono font-semibold tracking-wider ${isProMode ? 'text-neon-purple neon-text-purple' : 'text-muted-foreground'}`}>
        {isProMode ? 'DEVELOPER' : 'BEGINNER'}
      </span>
    </button>
  );
};

export default ModeToggle;
