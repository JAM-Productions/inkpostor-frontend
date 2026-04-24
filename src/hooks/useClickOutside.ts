import React, { useCallback, useEffect } from "react";

/**
 * Custom hook to handle clicks outside a specified element.
 * @param ref - React ref of the element to monitor.
 * @param isOpen - State indicating whether the dropdown is open.
 * @param setIsOpen - Function to call when clicking outside.
 */

export const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        ref.current &&
        event.target instanceof Node &&
        !ref.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    },
    [ref, setIsOpen],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);
};
