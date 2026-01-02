'use client';

import { motion } from 'framer-motion';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Luz Dourada Principal (Topo Esquerdo) */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-amber-600/10 rounded-full blur-[120px]"
      />

      {/* Luz Secundária Fria (Baixo Direito - para contraste) */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[100px]"
      />
    </div>
  );
}