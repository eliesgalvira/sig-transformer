'use client';

import { useEffect, useState } from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useSignal } from '@/contexts/signal-context';
import { AlertTriangle, MousePointer2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldTitle } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getFrequencyTooltip,
  getFrequencyLabel,
  getMaxBandwidth,
  getPhaseTooltip,
  getPhaseLabel,
  type SignalDraft,
} from '@/features/signal-workbench';
import type { WaveformShape } from '@/lib/types/signal';
import { cn } from '@/lib/utils';

const displayTextClass = 'font-mono text-xs font-bold tracking-widest uppercase';
const bodyTextClass = 'font-mono text-xs leading-relaxed';
const controlTextClass = 'font-mono text-xs font-medium tracking-[0.12em] uppercase';
const overlayClassName =
  'wb-menu-panel z-50 max-w-56 rounded-none border px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]';

function useSupportsHover(): boolean {
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setSupportsHover(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);

      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener(update);

    return () => mediaQuery.removeListener(update);
  }, []);

  return supportsHover;
}

function ParameterHelpText({ tooltip }: { tooltip: string }) {
  return <p className={cn(bodyTextClass, 'max-w-52 wb-text')}>{tooltip}</p>;
}

function ParameterLabel({
  fieldId,
  tooltip,
  children,
}: {
  fieldId: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  const labelId = `${fieldId}-label`;
  const supportsHover = useSupportsHover();
  const trigger = (
    <button
      type="button"
      id={labelId}
      className="cursor-help bg-transparent p-0 text-left underline decoration-dotted underline-offset-4 outline-none wb-focus-ring"
    >
      {children}
    </button>
  );

  return (
    <FieldTitle className={cn(displayTextClass, 'wb-text-muted')}>
      {supportsHover ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="top" className={overlayClassName}>
            <ParameterHelpText tooltip={tooltip} />
          </TooltipContent>
        </Tooltip>
      ) : (
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content side="top" sideOffset={6} className={overlayClassName}>
              <ParameterHelpText tooltip={tooltip} />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}
    </FieldTitle>
  );
}

export function WaveformGenerator() {
  const { draft, errorMessage, isLoading, status, submitDraft, updateDraft } = useSignal();
  const form = draft;

  // Dynamic labels based on waveform
  const frequencyLabel = getFrequencyLabel(form.waveform);
  const phaseLabel = getPhaseLabel(form.waveform);
  const maxBandwidth = getMaxBandwidth(form.start, form.end, form.interval);

  const updateForm = (updates: Partial<SignalDraft>) => updateDraft(updates);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitDraft();
  };

  return (
    <TooltipProvider>
      <Card className="wb-panel h-full flex flex-col rounded-none border-none shadow-none backdrop-blur-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className={cn(displayTextClass, 'wb-title')}>
            Function Generator
          </CardTitle>
          <CardDescription className={cn(displayTextClass, 'wb-text-soft')}>
            Parametrized functions
          </CardDescription>
          <Alert className="mt-4 border-[var(--wb-border)] bg-[var(--wb-accent-soft)] text-[var(--wb-accent-strong)] shadow-[inset_0_0_10px_var(--wb-accent-ghost)]">
            <MousePointer2 />
            <AlertTitle className={cn(displayTextClass, 'wb-accent-strong')}>
              Canvas Controls
            </AlertTitle>
            <AlertDescription className={cn(bodyTextClass, 'mt-1.5 text-[var(--wb-text-muted)]')}>
              To zoom in or zoom out on the graphs use your mouse wheel, two-finger scroll on touchpad or pinch with your fingers on mobile.
            </AlertDescription>
          </Alert>
          {errorMessage ? (
            <Alert className="mt-4 border-red-500/30 bg-red-500/10 text-red-100 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]">
              <AlertTriangle />
              <AlertTitle className={cn(displayTextClass, 'text-red-200')}>
                Workbench State
              </AlertTitle>
              <AlertDescription className={cn(bodyTextClass, 'mt-1.5 text-red-100/80')}>
                {errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <CardContent className="px-6 flex-1 flex flex-col">
            <FieldGroup className="gap-4">
            {/* Row 1: Start and End */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel fieldId="start" tooltip="Sets where the sampled interval begins.">
                  Start:
                </ParameterLabel>
                <Input
                  type="number"
                  id="start"
                  aria-labelledby="start-label"
                  value={form.start}
                  onChange={(e) => updateForm({ start: e.target.value })}
                  step="0.1"
                  min="-50"
                  max="-1"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
              <Field>
                <ParameterLabel fieldId="end" tooltip="Sets where the sampled interval ends.">
                  End:
                </ParameterLabel>
                <Input
                  type="number"
                  id="end"
                  aria-labelledby="end-label"
                  value={form.end}
                  onChange={(e) => updateForm({ end: e.target.value })}
                  step="0.1"
                  min="1"
                  max="50"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
            </div>

            {/* Row 2: Waveform and Amplitude */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel fieldId="waveform" tooltip="Chooses which function shape will be generated.">
                  Waveform:
                </ParameterLabel>
                <Select value={form.waveform} onValueChange={(v) => updateForm({ waveform: v as WaveformShape })}>
                  <SelectTrigger
                    id="waveform"
                    aria-labelledby="waveform-label"
                    className="wb-input h-8 font-mono text-xs font-medium tracking-[0.12em] uppercase focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                  >
                    <SelectValue placeholder="Select waveform" />
                  </SelectTrigger>
                  <SelectContent className="wb-menu-panel border">
                    <SelectItem value="square" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      Square
                    </SelectItem>
                    <SelectItem value="triangle" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      Triangle
                    </SelectItem>
                    <SelectItem value="sinc" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      Sinc
                    </SelectItem>
                    <SelectItem value="cos" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      Cosine
                    </SelectItem>
                    <SelectItem value="sin" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      Sine
                    </SelectItem>
                    <SelectItem value="exp" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      exp
                    </SelectItem>
                    <SelectItem value="sign" className={cn(controlTextClass, 'wb-text data-[highlighted]:bg-[var(--wb-panel-strong)] data-[highlighted]:text-[var(--wb-title)]')}>
                      sign
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <ParameterLabel fieldId="amplitude" tooltip="Controls the height or strength of the waveform.">
                  Amplitude (A):
                </ParameterLabel>
                <Input
                  type="number"
                  id="amplitude"
                  aria-labelledby="amplitude-label"
                  value={form.amplitude}
                  onChange={(e) => updateForm({ amplitude: e.target.value })}
                  step="0.1"
                  min="-100"
                  max="100"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
            </div>

            {/* Row 3: Frequency and Phase */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel fieldId="frequency" tooltip={getFrequencyTooltip(form.waveform)}>
                  {frequencyLabel}
                </ParameterLabel>
                <Input
                  type="number"
                  id="frequency"
                  aria-labelledby="frequency-label"
                  value={form.frequency}
                  onChange={(e) => updateForm({ frequency: e.target.value })}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
              <Field>
                <ParameterLabel fieldId="phase" tooltip={getPhaseTooltip(form.waveform)}>
                  {phaseLabel}
                </ParameterLabel>
                <Input
                  type="number"
                  id="phase"
                  aria-labelledby="phase-label"
                  value={form.phase}
                  onChange={(e) => updateForm({ phase: e.target.value })}
                  step="0.01"
                  min="-100"
                  max="100"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
            </div>

            {/* Row 4: Interval and Frequency Range */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel fieldId="interval" tooltip="Sets the sampling step between generated points.">
                  Interval (T):
                </ParameterLabel>
                <Input
                  type="number"
                  id="interval"
                  aria-labelledby="interval-label"
                  value={form.interval}
                  onChange={(e) => updateForm({ interval: e.target.value })}
                  step="0.01"
                  min="0.01"
                  max="0.1"
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
              <Field>
                <ParameterLabel
                  fieldId="bandwidth"
                  tooltip="Limits how much of the frequency spectrum is displayed."
                >
                  BW (&lt;= {maxBandwidth} Hz):
                </ParameterLabel>
                <Input
                  type="number"
                  id="bandwidth"
                  aria-labelledby="bandwidth-label"
                  value={form.bandwidth}
                  onChange={(e) => updateForm({ bandwidth: e.target.value })}
                  step="0.1"
                  min="0.1"
                  max={maxBandwidth}
                  className="wb-input h-8 font-mono text-xs tracking-[0.12em] focus:border-[var(--wb-accent)] focus:ring-[color:var(--wb-accent-soft)]"
                />
              </Field>
            </div>
            </FieldGroup>

            {/* Decorative Hardware Interface Panel */}
            <div className="wb-panel-strong relative mt-auto mb-auto flex items-end justify-between overflow-hidden rounded-lg border p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.14)]">
              {/* Ventilation grill pattern top right */}
              <div className="absolute top-2 right-2 flex gap-1 z-0 opacity-20">
                <div className="h-6 w-1 rounded-full bg-[var(--wb-input-border)]"></div>
                <div className="h-6 w-1 rounded-full bg-[var(--wb-input-border)]"></div>
                <div className="h-6 w-1 rounded-full bg-[var(--wb-input-border)]"></div>
                <div className="h-6 w-1 rounded-full bg-[var(--wb-input-border)]"></div>
              </div>

              <div className="flex flex-col gap-2 z-10 w-full pl-1">
                <div className="flex justify-between items-end w-full">
                  {/* Left Side: Mock Hard Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-1 pointer-events-none">
                    {['Mod', 'Sweep', 'Burst', 'Utility'].map((label) => (
                      <div key={label} className="flex h-5 w-12 items-center justify-center rounded-sm border border-[var(--wb-border-soft)] bg-[var(--wb-panel-soft)] shadow-sm">
                        <span className="text-[8px] font-mono font-bold capitalize tracking-tighter wb-text-muted">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Center/Right Side: Hardware Ports (BNC Connectors) */}
                  <div className="flex gap-5 pr-2 pointer-events-none">
                    {/* Active Channel */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="mb-0.5 rounded-[2px] border border-[var(--wb-border)] bg-[var(--wb-accent-soft)] px-1.5 text-[8px] font-mono font-bold wb-accent">CH 1</div>
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[var(--wb-accent)] bg-[var(--wb-panel-soft)] shadow-[0_0_12px_var(--wb-accent-ghost),inset_0_0_10px_rgba(0,0,0,0.2)]">
                        {/* Inner BNC Ring */}
                        <div className="relative flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--wb-border-soft)] bg-[var(--wb-panel)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.16)]">
                          {/* Core pin */}
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--wb-accent-strong)] shadow-[0_0_3px_var(--wb-accent)]"></div>
                          {/* Bayonet nubs */}
                          <div className="absolute -top-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-[1px] bg-[var(--wb-text-muted)]"></div>
                          <div className="absolute -bottom-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-[1px] bg-[var(--wb-text-muted)]"></div>
                        </div>
                      </div>
                      <div className="mt-1 text-[7px] font-mono wb-text-soft">50Ω</div>
                    </div>

                    {/* Inactive Channel */}
                    <div className="flex flex-col items-center gap-0.5 opacity-50 relative">
                      <div className="mb-0.5 rounded-[2px] border border-[var(--wb-border-soft)] bg-[var(--wb-panel-soft)] px-1.5 text-[8px] font-mono font-bold wb-text-muted">CH 2</div>
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[var(--wb-border-soft)] bg-[var(--wb-panel-soft)] shadow-[inset_0_0_10px_rgba(0,0,0,0.16)]">
                        <div className="relative flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--wb-border-soft)] bg-[var(--wb-panel)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.16)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--wb-text-soft)]"></div>
                          <div className="absolute -top-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-[1px] bg-[var(--wb-text-soft)]"></div>
                          <div className="absolute -bottom-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-[1px] bg-[var(--wb-text-soft)]"></div>
                        </div>
                      </div>
                      <div className="mt-1 text-[7px] font-mono wb-text-soft">HighZ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 border-t-0">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 w-full border border-[var(--wb-border)] bg-[var(--wb-accent-soft)] font-mono text-xs font-bold tracking-widest uppercase text-[var(--wb-accent-strong)] transition-all duration-200 hover:border-[var(--wb-accent)] hover:bg-[var(--wb-accent-ghost)] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-t-purple-400 border-purple-400/30 rounded-full animate-spin" />
                  {status === 'booting' ? 'Loading...' : 'Generating...'}
                </span>
              ) : (
                'Generate function'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </TooltipProvider>
  );
}
