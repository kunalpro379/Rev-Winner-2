import { useState, useRef, useCallback, useEffect } from "react";

interface ThrottledStateOptions<T> {
  initialValue: T;
  throttleMs?: number;
  onFlush?: (value: T) => void;
}

export function useThrottledState<T>({
  initialValue,
  throttleMs = 250,
  onFlush
}: ThrottledStateOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const pendingRef = useRef<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushRef = useRef<number>(Date.now());

  const flush = useCallback(() => {
    setValue(pendingRef.current);
    onFlush?.(pendingRef.current);
    lastFlushRef.current = Date.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [onFlush]);

  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    pendingRef.current = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(pendingRef.current)
      : newValue;

    const timeSinceLastFlush = Date.now() - lastFlushRef.current;
    
    if (timeSinceLastFlush >= throttleMs) {
      flush();
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flush, throttleMs - timeSinceLastFlush);
    }
  }, [throttleMs, flush]);

  const forceFlush = useCallback(() => {
    flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { value, update, forceFlush, pending: pendingRef.current };
}

interface ThrottledArrayOptions<T> {
  throttleMs?: number;
  maxBatchSize?: number;
  onFlush?: (items: T[]) => void;
}

export function useThrottledArray<T>({
  throttleMs = 200,
  maxBatchSize = 50,
  onFlush
}: ThrottledArrayOptions<T> = {}) {
  const [items, setItems] = useState<T[]>([]);
  const bufferRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushRef = useRef<number>(Date.now());

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    
    const batch = bufferRef.current;
    bufferRef.current = [];
    
    setItems(prev => {
      const next = [...prev, ...batch];
      return next;
    });
    
    onFlush?.(batch);
    lastFlushRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [onFlush]);

  const push = useCallback((item: T) => {
    bufferRef.current.push(item);
    
    if (bufferRef.current.length >= maxBatchSize) {
      flush();
      return;
    }

    const timeSinceLastFlush = Date.now() - lastFlushRef.current;
    
    if (timeSinceLastFlush >= throttleMs) {
      flush();
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flush, throttleMs - timeSinceLastFlush);
    }
  }, [throttleMs, maxBatchSize, flush]);

  const clear = useCallback(() => {
    bufferRef.current = [];
    setItems([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const forceFlush = useCallback(() => {
    flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { 
    items, 
    push, 
    clear, 
    forceFlush,
    bufferSize: bufferRef.current.length,
    setItems
  };
}
