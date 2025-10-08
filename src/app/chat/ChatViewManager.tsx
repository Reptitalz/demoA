// src/app/chat/ChatViewManager.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? "100%" : "-100%",
  }),
  animate: {
    opacity: 1,
    x: "0%",
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.4
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? "100%" : "-100%",
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.4
    }
  }),
};


const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Find the index of the current route to determine animation direction
  const routeOrder = ['/chat/dashboard', '/chat/updates', '/chat/profile', '/chat/admin'];
  const currentIndex = routeOrder.findIndex(route => pathname.startsWith(route));
  
  // A simple way to manage direction. In a more complex app, you might use a state management library.
  const [prevIndex, setPrevIndex] = React.useState(currentIndex);
  const direction = currentIndex > prevIndex ? 1 : -1;
  
  React.useEffect(() => {
    setPrevIndex(currentIndex);
  }, [currentIndex]);
  

  const isManagedRoute = routeOrder.some(route => pathname.startsWith(route));

  if (!isManagedRoute) {
    // If it's a specific conversation or another page, just render it without animations
    return <>{children}</>;
  }

  return (
    <div className="h-full w-full overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
            key={pathname}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
