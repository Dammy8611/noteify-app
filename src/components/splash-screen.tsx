'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-4">
          <Image src="/logo.png" alt="Noteify Logo" width={80} height={80} />
          <h1 className="text-6xl font-bold text-primary font-headline">Noteify</h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">by dtechy.dev</p>
      </motion.div>
    </motion.div>
  );
}
