'use client';

import { useEffect, useState } from 'react';
import {
  applyWorkbenchTheme,
  normalizeWorkbenchTheme,
  readDocumentWorkbenchTheme,
  WORKBENCH_THEME_EVENT,
  WORKBENCH_THEME_KEY,
  type WorkbenchTheme,
} from '@/lib/workbench-theme';

export function useWorkbenchTheme() {
  const [theme, setThemeState] = useState<WorkbenchTheme>('dark');

  useEffect(() => {
    const syncTheme = () => {
      setThemeState(readDocumentWorkbenchTheme());
    };

    syncTheme();

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<WorkbenchTheme>).detail;
      setThemeState(normalizeWorkbenchTheme(nextTheme));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== WORKBENCH_THEME_KEY) {
        return;
      }

      setThemeState(normalizeWorkbenchTheme(event.newValue));
    };

    window.addEventListener(WORKBENCH_THEME_EVENT, handleThemeChange as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(WORKBENCH_THEME_EVENT, handleThemeChange as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (nextTheme: WorkbenchTheme) => {
    applyWorkbenchTheme(nextTheme);
    setThemeState(nextTheme);
  };

  return { theme, setTheme };
}
