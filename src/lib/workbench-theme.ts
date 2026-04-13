export type WorkbenchTheme = 'dark' | 'cream';

export const WORKBENCH_THEME_KEY = 'workbench-theme';
export const WORKBENCH_THEME_EVENT = 'workbench-themechange';

export function normalizeWorkbenchTheme(value: string | null | undefined): WorkbenchTheme {
  return value === 'cream' ? 'cream' : 'dark';
}

export function readDocumentWorkbenchTheme(): WorkbenchTheme {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return normalizeWorkbenchTheme(document.documentElement.dataset.workbenchTheme);
}

export function applyWorkbenchTheme(theme: WorkbenchTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.workbenchTheme = theme;
  window.localStorage.setItem(WORKBENCH_THEME_KEY, theme);
  window.dispatchEvent(
    new CustomEvent<WorkbenchTheme>(WORKBENCH_THEME_EVENT, {
      detail: theme,
    })
  );
}
