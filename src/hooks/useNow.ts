import { useEffect, useState } from 'react';

/** The current time, read again every `intervalMs` (and when the tab comes back into view). */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [intervalMs]);
  return now;
}
