import { motion } from "framer-motion";

export default function Speech({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white text-black px-10 py-6 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.4)] mt-4 font-bold text-3xl relative max-w-lg text-center leading-relaxed"
    >
      <span className="text-6xl absolute -left-12 -top-10 animate-bounce">💬</span>
      {text}
    </motion.div>
  );
}
