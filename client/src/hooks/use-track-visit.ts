import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function useTrackVisit() {
  const [location] = useLocation();
  const lastTrackedPage = useRef<string>("");

  useEffect(() => {
    if (location === lastTrackedPage.current) {
      return;
    }
    
    lastTrackedPage.current = location;

    const trackVisit = async () => {
      try {
        await fetch("/api/track-visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitedPage: location,
          }),
        });
      } catch (error) {
        // Silent fail - don't interrupt user experience for analytics
        console.debug("[Traffic] Failed to track visit:", error);
      }
    };

    // Small delay to not block page render
    const timeoutId = setTimeout(trackVisit, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location]);
}
