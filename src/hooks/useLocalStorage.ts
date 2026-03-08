import { useState, useCallback } from 'react';
import { data } from '@/lib/data';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = data.get<T>(key);
    return item !== null ? item : initialValue;
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      data.set(key, newValue);
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}

// Force re-render hook
export function useForceUpdate() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick(t => t + 1), []);
}
