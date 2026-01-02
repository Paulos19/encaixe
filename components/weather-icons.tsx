'use client';

import { motion } from 'framer-motion';

// Sol Girando (Dourado Premium)
export const SunIcon = () => (
  <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.circle 
      cx="12" cy="12" r="4" 
      className="fill-amber-500"
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.8, 1, 0.8] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <motion.path 
      d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" 
      stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    />
  </motion.svg>
);

// Nuvens Flutuando (Cinza Sóbrio)
export const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      d="M18 10C18 6.68629 15.3137 4 12 4C9.33318 4 7.08032 5.75323 6.24357 8.15176C3.9056 8.52554 2.25 10.6617 2.25 13.125C2.25 15.8864 4.48858 18.125 7.25 18.125H17.5C20.5376 18.125 23 15.6626 23 12.625C23 9.69741 20.7165 7.29415 18 7.03125V10Z"
      className="fill-zinc-400/50 stroke-zinc-400"
      strokeWidth="1.5"
      animate={{ x: [-2, 2, -2] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

// Chuva Caindo
export const RainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
     <path d="M16 13C16 10.2386 13.7614 8 11 8C8.75527 8 6.86595 9.47563 6.22383 11.4883C4.26442 11.8021 2.875 13.5938 2.875 15.6562C2.875 17.9699 4.75013 19.8438 7.0625 19.8438H15.5C18.0543 19.8438 20.125 17.7731 20.125 15.2188C20.125 12.7563 18.2045 10.7412 15.9167 10.5208" className="stroke-zinc-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
     <motion.path d="M8 13V15" className="stroke-blue-400" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, 5], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
     <motion.path d="M12 15V17" className="stroke-blue-400" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, 5], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
     <motion.path d="M16 13V15" className="stroke-blue-400" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, 5], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
  </svg>
);

// Trovoadas (Alerta)
export const StormIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 13C16 10.2386 13.7614 8 11 8C8.75527 8 6.86595 9.47563 6.22383 11.4883C4.26442 11.8021 2.875 13.5938 2.875 15.6562C2.875 17.9699 4.75013 19.8438 7.0625 19.8438H15.5C18.0543 19.8438 20.125 17.7731 20.125 15.2188C20.125 12.7563 18.2045 10.7412 15.9167 10.5208" className="stroke-zinc-500 fill-zinc-500/20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <motion.path 
      d="M11 14L9 17H12L10 21" 
      className="stroke-amber-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      animate={{ opacity: [1, 0.3, 1, 0, 1] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }} 
    />
  </svg>
);