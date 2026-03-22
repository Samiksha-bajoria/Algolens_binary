import { motion } from "framer-motion";

export default function IfBlock({ condition, result }: { condition: string; result: boolean }) {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="text-white mb-10 font-mono text-3xl bg-purple-900/60 px-10 py-5 rounded-2xl border-2 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        ? {condition} ?
      </div>
      <div className="flex gap-16">
        <motion.div
          animate={{ opacity: result ? 1 : 0.2, scale: result ? 1.2 : 0.8 }}
          className="bg-green-600 p-8 rounded-2xl shadow-[0_0_30px_rgba(22,163,74,0.6)] font-bold tracking-widest text-white border-4 border-green-400 text-4xl flex items-center justify-center relative"
        >
          {result && <span className="absolute -top-6 text-2xl">✅</span>}
          TRUE
        </motion.div>
        <motion.div
          animate={{ opacity: !result ? 1 : 0.2, scale: !result ? 1.2 : 0.8 }}
          className="bg-red-600 p-8 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] font-bold tracking-widest text-white border-4 border-red-400 text-4xl flex items-center justify-center relative"
        >
          {!result && <span className="absolute -top-6 text-2xl">❌</span>}
          FALSE
        </motion.div>
      </div>
    </div>
  );
}
