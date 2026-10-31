import { useEffect, useState } from 'react';

// Value badalte hi nahi, delay ke baad badalti hai (map har pixel par request na bheje)
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
