import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Code2, Terminal, ChevronRight, Cpu, Layers } from 'lucide-react';
import { useEffect, useRef } from 'react';

const FADE_DOWN_ANIMATION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' } },
};

const STAGGER_CHILDREN_ANIMATION: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = 'auto' };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[200vh] bg-[#0A0A0F] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      
      {/* Dynamic Background Mesh */}
      <motion.div 
        style={{ y: yBackground }}
        className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
      >
        <div className="absolute top-0 w-full h-[800px] bg-gradient-to-b from-purple-900/40 via-blue-900/10 to-transparent" />
        <div className="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[100px] right-[100px] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[150px]" />
      </motion.div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={STAGGER_CHILDREN_ANIMATION}
          className="max-w-4xl mx-auto flex flex-col items-center text-center mt-[-10vh]"
        >
          <motion.div variants={FADE_DOWN_ANIMATION_VARIANTS} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-purple-300 mb-8 backdrop-blur-md">
            <Sparkles size={14} />
            <span>AlgoLens Engine v2.0 Live</span>
          </motion.div>
          
          <motion.h1 variants={FADE_DOWN_ANIMATION_VARIANTS} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Visualize execution.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Master the logic.
            </span>
          </motion.h1>
          
          <motion.p variants={FADE_DOWN_ANIMATION_VARIANTS} className="text-lg md:text-xl text-white/50 max-w-2xl mb-12">
            The ultimate AI-powered execution sandbox. Step through algorithms line-by-line, dynamically render layouts using Framer Motion, and dive deep into your memory tree.
          </motion.p>

          {/* Action Cards */}
          <motion.div variants={FADE_DOWN_ANIMATION_VARIANTS} className="flex flex-col md:flex-row items-stretch gap-6 w-full max-w-3xl">
            
            {/* Beginner Mode */}
            <motion.div 
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/app?mode=coding')}
              className="group relative flex-1 p-1 rounded-2xl bg-gradient-to-b from-blue-500/20 to-transparent border border-blue-500/20 hover:border-blue-500/50 cursor-pointer overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-blue-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative h-full flex flex-col bg-black/60 backdrop-blur-xl p-8 rounded-xl items-start text-left">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                  <Code2 className="text-blue-400" size={24} />
                </div>
                <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  Coding <ChevronRight className="w-5 h-5 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-white/50 text-sm flex-1 mb-6">
                  Enter Beginner Mode. Perfect for tracing sorting arrays, learning control flow natively, and watching structural animations.
                </p>
                <span className="text-xs font-mono text-blue-400/80 uppercase tracking-widest mt-auto border-t border-white/5 pt-4 w-full">
                  Guided Interface
                </span>
              </div>
            </motion.div>

            {/* Developer Mode */}
            <motion.div 
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/app?mode=developing')}
              className="group relative flex-1 p-1 rounded-2xl bg-gradient-to-b from-purple-500/20 to-transparent border border-purple-500/20 hover:border-purple-500/50 cursor-pointer overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-purple-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative h-full flex flex-col bg-black/60 backdrop-blur-xl p-8 rounded-xl items-start text-left">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                  <Terminal className="text-purple-400" size={24} />
                </div>
                <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  Developing <ChevronRight className="w-5 h-5 text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-white/50 text-sm flex-1 mb-6">
                  Enter Developer Mode. Unleash the Live AI Sandbox, execute unconstrained logic natively injected over Babel mappings.
                </p>
                <span className="text-xs font-mono text-purple-400/80 uppercase tracking-widest mt-auto border-t border-white/5 pt-4 w-full">
                  Unrestricted Sandbox
                </span>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/30"
        >
          <span className="text-[10px] uppercase tracking-widest mb-2 font-mono">Discover More</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-1 h-12 bg-gradient-to-b from-white/30 to-transparent rounded-full" 
          />
        </motion.div>
      </div>

      {/* Feature Showcase (Scroll Reveal) */}
      <div className="relative z-10 min-h-screen py-24 px-6 flex flex-col items-center">
        <div className="max-w-5xl mx-auto w-full">
          
          <FeatureRow 
            icon={<Cpu className="text-blue-400" size={32} />}
            title="Real-time JIT Evaluation"
            desc="Algorithms map dynamically into native Abstract Syntax Trees before automatically hooking into Google Gemini 1.5 Pro to physically construct layout boundaries."
            align="left"
          />
          
          <FeatureRow 
            icon={<Layers className="text-purple-400" size={32} />}
            title="Physics Framer Motion"
            desc="Elements don't just disappear—they organically traverse the DOM utilizing deeply integrated spring configurations avoiding rendering layout disruptions completely."
            align="right"
          />

        </div>
      </div>

    </div>
  );
}

function FeatureRow({ icon, title, desc, align }: { icon: any, title: string, desc: string, align: 'left' | 'right' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, type: 'spring' }}
      className={`flex flex-col ${align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 w-full my-32`}
    >
      <div className={`flex-1 text-center ${align === 'right' ? 'md:text-left' : 'md:text-right'}`}>
        <div className={`inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 ${align === 'right' ? 'mr-auto' : 'ml-auto'}`}>
          {icon}
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-lg text-white/50">{desc}</p>
      </div>
      <div className="flex-1 w-full aspect-video rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md flex items-center justify-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,50,255,0.1),transparent_70%)]" />
         <div className="w-1/2 h-4/5 border border-white/10 rounded-xl bg-black/40 shadow-inner flex flex-col overflow-hidden">
            <div className="h-6 w-full border-b border-white/10 bg-white/5 flex items-center px-3 gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500/50" />
               <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
               <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 p-4 grid grid-cols-5 gap-2 content-center items-center justify-items-center">
               <motion.div animate={{ height: [20, 40, 20] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-full bg-blue-500/40 rounded-sm" />
               <motion.div animate={{ height: [40, 20, 60] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-full bg-purple-500/40 rounded-sm" />
               <motion.div animate={{ height: [60, 40, 30] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-full bg-pink-500/40 rounded-sm" />
               <motion.div animate={{ height: [30, 80, 50] }} transition={{ repeat: Infinity, duration: 2.1 }} className="w-full bg-indigo-500/40 rounded-sm" />
               <motion.div animate={{ height: [80, 50, 40] }} transition={{ repeat: Infinity, duration: 1.6 }} className="w-full bg-cyan-500/40 rounded-sm" />
            </div>
         </div>
      </div>
    </motion.div>
  );
}
