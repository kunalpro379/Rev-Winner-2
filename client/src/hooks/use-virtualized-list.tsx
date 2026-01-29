import { useState, useRef, useCallback, useEffect, useMemo } from "react";

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  itemCount: number;
}

interface VirtualizedListResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetTop: number;
  visibleItems: number[];
  scrollTo: (index: number) => void;
  scrollToEnd: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualizedList({
  itemHeight,
  containerHeight,
  overscan = 5,
  itemCount
}: VirtualizedListOptions): VirtualizedListResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef(false);

  const totalHeight = itemCount * itemHeight;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2);
    
    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, itemCount]);

  const visibleItems = useMemo(() => {
    const items: number[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push(i);
    }
    return items;
  }, [visibleRange]);

  const offsetTop = visibleRange.start * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isAutoScrollingRef.current) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  }, []);

  const scrollTo = useCallback((index: number) => {
    if (containerRef.current) {
      isAutoScrollingRef.current = true;
      const targetScroll = index * itemHeight;
      containerRef.current.scrollTop = targetScroll;
      setScrollTop(targetScroll);
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    }
  }, [itemHeight]);

  const scrollToEnd = useCallback(() => {
    if (containerRef.current) {
      isAutoScrollingRef.current = true;
      const targetScroll = totalHeight - containerHeight;
      containerRef.current.scrollTop = Math.max(0, targetScroll);
      setScrollTop(Math.max(0, targetScroll));
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    }
  }, [totalHeight, containerHeight]);

  return {
    visibleRange,
    totalHeight,
    offsetTop,
    visibleItems,
    scrollTo,
    scrollToEnd,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    onScroll
  };
}

interface SimpleVirtualizedOptions<T> {
  items: T[];
  estimatedItemHeight?: number;
  overscan?: number;
}

export function useSimpleVirtualization<T>({
  items,
  estimatedItemHeight = 40,
  overscan = 10
}: SimpleVirtualizedOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan);
    const visibleCount = Math.ceil(clientHeight / estimatedItemHeight);
    const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [items.length, estimatedItemHeight, overscan]);

  const onScroll = useCallback(() => {
    updateVisibleRange();
  }, [updateVisibleRange]);

  useEffect(() => {
    updateVisibleRange();
  }, [items.length, updateVisibleRange]);

  const scrollToEnd = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const paddingTop = visibleRange.start * estimatedItemHeight;
  const paddingBottom = Math.max(0, (items.length - visibleRange.end) * estimatedItemHeight);

  return {
    containerRef,
    visibleItems,
    visibleRange,
    paddingTop,
    paddingBottom,
    onScroll,
    scrollToEnd,
    totalCount: items.length
  };
}
