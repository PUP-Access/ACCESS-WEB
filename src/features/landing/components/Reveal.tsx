"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, type ReactNode } from "react";

const viewport = { once: true, amount: 0.2 } as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

type RevealStaggerProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  stagger?: number;
  y?: number;
};

export function RevealStagger({
  children,
  className,
  itemClassName,
  stagger = 0.06,
  y = 24,
}: RevealStaggerProps) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  if (reduce) {
    return (
      <div className={className}>
        {items.map((child, i) => (
          <div key={i} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          className={itemClassName}
          initial={{ opacity: 0, y }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: i * stagger,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
