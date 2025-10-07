import { motion } from 'framer-motion';
import { FileText, Paperclip } from 'lucide-react';
import type { DocoState } from '../../types';

interface DocoAvatarProps {
  state: DocoState;
}

export function DocoAvatar({ state }: DocoAvatarProps) {
  const stateConfig = {
    idle: {
      animation: { y: [0, -10, 0] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      glow: false,
    },
    listening: {
      animation: { scale: [1, 1.05, 1] },
      transition: { duration: 1, repeat: Infinity },
      glow: true,
    },
    thinking: {
      animation: { rotate: [0, 5, -5, 0] },
      transition: { duration: 0.5, repeat: Infinity },
      glow: true,
    },
    speaking: {
      animation: { y: [0, -5, 0] },
      transition: { duration: 0.3, repeat: Infinity },
      glow: false,
    },
    error: {
      animation: { x: [-5, 5, -5, 5, 0] },
      transition: { duration: 0.5 },
      glow: false,
    },
  };

  const config = stateConfig[state];

  return (
    <div className="bg-slate-900 p-6 border-b border-slate-700">
      <div className="flex flex-col items-center">
        <motion.div
          animate={config.animation}
          transition={config.transition}
          className={`relative ${config.glow ? 'glow-cyan' : ''}`}
        >
          <img
            src="/Doco-nobackground.png"
            alt="Doco"
            className="w-24 h-24 object-contain"
          />

          <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full transition-all ${
            state === 'idle' || state === 'speaking'
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
              : state === 'error'
              ? 'bg-slate-600'
              : 'bg-cyan-400 animate-pulse-glow'
          }`} />
        </motion.div>

        <h2 className="mt-4 text-slate-100 text-xl font-semibold">Doco</h2>
        <p className="text-slate-400 text-sm">Your AI Document Assistant</p>
      </div>
    </div>
  );
}
