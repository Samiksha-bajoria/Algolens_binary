import { motion } from "framer-motion";

const AVATARS = ['🤖', '🦊', '🐼', '🦖', '🦄', '🦦', '🦉', '🐶', '🐱', '🐸'];

export default function Variable({ name, value }: { name: string; value: any }) {
  const getAvatar = (str: string) => {
    let sum = 0;
    for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
    return AVATARS[sum % AVATARS.length];
  };

  return (
    <div className="flex flex-col items-center gap-6">
       <motion.div 
         initial={{ scale: 0, rotate: -20 }} 
         animate={{ scale: 1, rotate: 0 }} 
         transition={{ type: 'spring', bounce: 0.6 }}
         className="text-[120px] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] relative"
       >
         {getAvatar(name)}
         <div className="absolute -bottom-4 -right-4 bg-primary text-black font-bold px-4 py-1 rounded-xl text-xl shadow-xl border-4 border-black">
           {name}
         </div>
       </motion.div>

       <motion.div
         initial={{ y: -50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.3, type: 'spring' }}
         className="bg-blue-600 text-white px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] border-2 border-blue-400 font-mono text-4xl mt-4"
       >
         = {value !== undefined ? String(value) : '?'}
       </motion.div>
    </div>
  );
}
