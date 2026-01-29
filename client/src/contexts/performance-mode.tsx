import { createContext, useContext, useState, useCallback, useMemo } from "react";

interface PerformanceModeState {
  isPerformanceMode: boolean;
  isTranscribing: boolean;
  reduceAnimations: boolean;
  throttleUpdates: boolean;
  disableHeavyEffects: boolean;
}

interface PerformanceModeContextValue extends PerformanceModeState {
  enablePerformanceMode: () => void;
  disablePerformanceMode: () => void;
  setTranscribing: (value: boolean) => void;
}

const PerformanceModeContext = createContext<PerformanceModeContextValue | null>(null);

interface PerformanceModeProviderProps {
  children: React.ReactNode;
}

export function PerformanceModeProvider({ children }: PerformanceModeProviderProps) {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const enablePerformanceMode = useCallback(() => {
    setIsPerformanceMode(true);
  }, []);

  const disablePerformanceMode = useCallback(() => {
    setIsPerformanceMode(false);
  }, []);

  const setTranscribing = useCallback((value: boolean) => {
    setIsTranscribing(value);
    if (value) {
      setIsPerformanceMode(true);
    } else {
      setIsPerformanceMode(false);
    }
  }, []);

  const value = useMemo<PerformanceModeContextValue>(() => ({
    isPerformanceMode: isPerformanceMode || isTranscribing,
    isTranscribing,
    reduceAnimations: isPerformanceMode || isTranscribing,
    throttleUpdates: isPerformanceMode || isTranscribing,
    disableHeavyEffects: isPerformanceMode || isTranscribing,
    enablePerformanceMode,
    disablePerformanceMode,
    setTranscribing
  }), [isPerformanceMode, isTranscribing, enablePerformanceMode, disablePerformanceMode, setTranscribing]);

  return (
    <PerformanceModeContext.Provider value={value}>
      {children}
    </PerformanceModeContext.Provider>
  );
}

export function usePerformanceMode() {
  const context = useContext(PerformanceModeContext);
  if (!context) {
    return {
      isPerformanceMode: false,
      isTranscribing: false,
      reduceAnimations: false,
      throttleUpdates: false,
      disableHeavyEffects: false,
      enablePerformanceMode: () => {},
      disablePerformanceMode: () => {},
      setTranscribing: () => {}
    };
  }
  return context;
}

export function useReducedMotion() {
  const { reduceAnimations } = usePerformanceMode();
  return reduceAnimations;
}
