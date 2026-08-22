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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const trickleTimer = useRef<NodeJS.Timeout | null>(null);
  const safetyTimer = useRef<NodeJS.Timeout | null>(null);
  const finishTimers = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    if (trickleTimer.current) {
      clearInterval(trickleTimer.current);
      trickleTimer.current = null;
    }
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    finishTimers.current.forEach((t) => clearTimeout(t));
    finishTimers.current = [];
  };

  const startLoading = useCallback(() => {
    clearAllTimers();
    setIsLoading(true);
    setVisible(true);
    setProgress(28);

    // Progressive trickle animation
    trickleTimer.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          return Math.min(94, prev + 0.4);
        }
        const step = Math.max(1.5, (90 - prev) * 0.15);
        return Math.min(88, prev + step);
      });
    }, 120);

    // Failsafe: never let the bar hang indefinitely (max 5s)
    safetyTimer.current = setTimeout(() => {
      stopLoading();
    }, 5000);
  }, []);

  const stopLoading = useCallback(() => {
    if (trickleTimer.current) {
      clearInterval(trickleTimer.current);
      trickleTimer.current = null;
    }
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }

    setIsLoading(false);
    // Snap cleanly to 100%
    setProgress(100);

    const t1 = setTimeout(() => {
      setVisible(false);
      const t2 = setTimeout(() => {
        setProgress(0);
      }, 250);
      finishTimers.current.push(t2);
    }, 250);
    finishTimers.current.push(t1);
  }, []);

  // When route changes, complete any pending bar animation
  useEffect(() => {
    if (visible && progress > 0 && progress < 100) {
      stopLoading();
    }
  }, [pathname, searchParams]);

  // Global internal link click listener: automatically activates progress bar on ANY link click
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if this is an internal application route change
      if (
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !anchor.target &&
        !anchor.hasAttribute('download') &&
        href !== pathname
      ) {
        startLoading();
      }
    }

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, [pathname, startLoading]);

  useEffect(() => {
    globalStartLoading = startLoading;
    globalStopLoading = stopLoading;
    return () => {
      globalStartLoading = null;
      globalStopLoading = null;
      clearAllTimers();
    };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
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
        className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: progress === 100 ? '200ms' : '120ms',
        }}
      />
      {/* Pulsing leading glowing head */}
      {visible && progress < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent blur-xs animate-pulse pointer-events-none"
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
