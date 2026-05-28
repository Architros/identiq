"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function BrandPageLoader() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center py-16"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <motion.div
        className="relative"
        animate={
          reduceMotion
            ? { opacity: [0.88, 1, 0.88], scale: [0.98, 1, 0.98] }
            : { rotate: [0, 180, 360], opacity: [0.45, 1, 0.45] }
        }
        transition={
          reduceMotion
            ? {
                duration: 1.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
            : {
                duration: 2.1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }
        }
      >
        <Image
          src="/brand/logo-identiq.svg"
          alt="Identiq"
          width={56}
          height={40}
          priority
          className="h-10 w-auto"
        />
      </motion.div>
    </div>
  );
}
