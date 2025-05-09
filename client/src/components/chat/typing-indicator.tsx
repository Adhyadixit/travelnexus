import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 p-2 rounded-lg bg-muted", className)}>
      <motion.div
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0,
        }}
        className="w-2 h-2 bg-foreground rounded-full opacity-50"
      />
      <motion.div
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.2,
        }}
        className="w-2 h-2 bg-foreground rounded-full opacity-50"
      />
      <motion.div
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.4,
        }}
        className="w-2 h-2 bg-foreground rounded-full opacity-50"
      />
    </div>
  );
}