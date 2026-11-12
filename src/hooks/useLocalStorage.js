import { useState, useEffect } from "react";

/**
 * Custom hook that syncs React state with window.localStorage.
 * Safely handles JSON parsing errors or restricted storage environments.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota or private-browsing errors
    }
  }, [key, value]);

  return [value, setValue];
}

