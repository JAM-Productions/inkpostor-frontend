import React, { useLayoutEffect, useRef, useState } from "react";

export interface CanvasBox {
  width: number;
  height: number;
}

export interface UseCanvasBox {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** `null` until the container has been laid out and has a size to report. */
  size: CanvasBox | null;
}

/**
 * Follows the size of the box a canvas is drawn into.
 *
 * The same size is reported as the same object, so whatever paints off the back
 * of it only wakes up when the box really changed — and a resize does mean a
 * repaint, because resizing a canvas buffer wipes what was on it.
 */
export const useCanvasBox = (): UseCanvasBox => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<CanvasBox | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      setSize((current) =>
        current?.width === width && current?.height === height
          ? current
          : { width, height },
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
};
