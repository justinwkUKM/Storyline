import React from 'react';
import { motion } from 'motion/react';
import storylineLogo from '../assets/storyline-limefrost.svg';
import { cn } from '../lib/utils';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      whileHover={{ 
        scale: 1.05, 
        y: -1.5,
        filter: 'drop-shadow(0 8px 12px rgba(17, 35, 18, 0.12))'
      }}
      whileTap={{ scale: 0.98 }}
      className="inline-block cursor-pointer"
    >
      <img
        src={storylineLogo}
        alt="Storyline"
        className={cn('block w-auto object-contain', className)}
      />
    </motion.div>
  );
}
