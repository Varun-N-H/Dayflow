'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

// Global emitter for non-React contexts or direct triggers
let globalStartLoading: (() => void) | null = null;
let globalStopLoading: (() => void) | null = null;

export const globalLoading = {
  start: () => globalStartLoading?.(),
  stop: () => globalStopLoading?.(),
};

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRequests = useRef(0);
  const trickleTimer = useRef<NodeJS.Timeout | null>(null);

  const clearTrickle = () => {
    if (trickleTimer.current) {
      clearInterval(trickleTimer.current);
      trickleTimer.current = null;
    }
  };

  const startLoading = useCallback(() => {
    activeRequests.current += 1;
    if (activeRequests.current === 1) {
      setVisible(true);
      setProgress((prev) => (prev > 0 && prev < 90 ? prev : 25));

      clearTrickle();
      trickleTimer.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) {
            // Trickle very slowly above 88%
            return Math.min(94, prev + 0.5);
          }
          // Asymptotic increase towards 90%
          const step = Math.max(1, (90 - prev) * 0.12);
          return Math.min(88, prev + step);
        });
      }, 150);
    }
  }, []);

  const stopLoading = useCallback(() => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    if (activeRequests.current === 0) {
      clearTrickle();
      // Snap to 100% completion
      setProgress(100);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        const resetTimer = setTimeout(() => {
          setProgress(0);
        }, 300);
        return () => clearTimeout(resetTimer);
      }, 300);

      return () => clearTimeout(hideTimer);
    }
  }, []);

  useEffect(() => {
    globalStartLoading = startLoading;
    globalStopLoading = stopLoading;
    return () => {
      globalStartLoading = null;
      globalStopLoading = null;
      clearTrickle();
    };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading: activeRequests.current > 0, startLoading, stopLoading }}>
      <TopProgressBarElement progress={progress} visible={visible} />
      {children}
    </LoadingContext.Provider>
  );
}

function TopProgressBarElement({ progress, visible }: { progress: number; visible: boolean }) {
  if (!visible && progress === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-transparent pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 transition-all ease-out shadow-[0_0_12px_rgba(168,85,247,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: progress === 100 ? '200ms' : '150ms',
        }}
      />
      {/* Pulsing leading glowing head */}
      {visible && progress < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs animate-pulse pointer-events-none"
          style={{
            left: `calc(${progress}% - 96px)`,
          }}
        />
      )}
    </div>
  );
}

// Backward compatibility export
export function TopProgressBar() {
  return null;
}
