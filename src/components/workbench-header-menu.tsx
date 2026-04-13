'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Github, MoonStar, SunMedium } from 'lucide-react';
import { useWorkbenchTheme } from '@/hooks/use-workbench-theme';
import { cn } from '@/lib/utils';

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-4.5">
      <span
        className={cn(
          'absolute left-0 top-0 h-[2px] w-4.5 rounded-full bg-current transition-all duration-300',
          open && 'top-[6px] rotate-45'
        )}
      />
      <span
        className={cn(
          'absolute left-0 top-[6px] h-[2px] w-2.5 rounded-full bg-current transition-all duration-300',
          open && 'w-0 opacity-0'
        )}
      />
      <span
        className={cn(
          'absolute left-0 top-[12px] h-[2px] w-4.5 rounded-full bg-current transition-all duration-300',
          open && 'top-[6px] -rotate-45'
        )}
      />
    </span>
  );
}

export function WorkbenchHeaderMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useWorkbenchTheme();
  const isCream = theme === 'cream';

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open workbench menu"
          className="wb-focus-ring wb-menu-action group flex h-10 w-10 items-center justify-center rounded-[1.15rem] border wb-panel-soft wb-title backdrop-blur-md"
        >
          <HamburgerIcon open={open} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={12}
          className="wb-menu-panel wb-menu-grid relative z-50 w-[18rem] overflow-hidden rounded-[1.75rem] border p-4 text-sm backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--wb-accent)] to-transparent opacity-70" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] wb-accent">
                Access Panel
              </p>
              <h2 className="mt-2 font-mono text-[1.65rem] font-bold uppercase tracking-[0.14em] wb-title">
                Surface Controls
              </h2>
            </div>
            <div className="rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.24em] wb-panel-soft wb-text-muted">
              {theme}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border p-3 wb-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] wb-text-soft">
                  Theme
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] wb-title">
                  {isCream ? 'Cream Mode' : 'Dark Mode'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Toggle workbench theme"
                onClick={() => setTheme(isCream ? 'dark' : 'cream')}
                className="wb-focus-ring wb-menu-action wb-theme-track relative flex h-10 w-[5.25rem] items-center rounded-full border px-1"
              >
                <span
                  className={cn(
                    'wb-theme-thumb absolute left-1 flex h-8 w-8 items-center justify-center rounded-full border shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-transform duration-300',
                    isCream && 'translate-x-[2.75rem]'
                  )}
                >
                  {isCream ? <SunMedium className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
                </span>
                <span className="flex w-full items-center justify-between px-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] wb-text-soft">
                  <span>D</span>
                  <span>C</span>
                </span>
              </button>
            </div>
          </div>

          <Link
            href="https://www.github.com/eliesgalvira/sig-transformer"
            target="_blank"
            rel="noopener noreferrer"
            className="wb-focus-ring wb-menu-action mt-3 flex items-center justify-between rounded-2xl border p-3 wb-panel"
          >
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] wb-text-soft">
                Repository
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] wb-title">
                Open on GitHub
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-[1rem] border wb-panel-soft wb-accent">
              <Github className="h-3.5 w-3.5" />
            </span>
          </Link>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
