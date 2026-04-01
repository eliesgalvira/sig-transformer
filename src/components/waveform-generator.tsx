'use client';

import { useLocalStorage } from 'usehooks-ts';
import { useSignal } from '@/contexts/signal-context';
import { MousePointer2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_PARAMS, type SignalParams, type WaveformShape } from '@/lib/types/signal';
import {
  STORAGE_KEY,
  getFrequencyLabel,
  getPhaseLabel,
  calculateDynamicMax,
} from '@/lib/signal/handler';
import { cn } from '@/lib/utils';

type StoredSignalParams = {
  a: string | number;
  b: string | number;
  signalShape: WaveformShape;
  amplitude: string | number;
  frequency: string | number;
  phase: string | number;
  interval: string | number;
  freqrange: string | number;
};

type FormState = {
  start: string;
  end: string;
  waveform: WaveformShape;
  amplitude: string;
  frequency: string;
  phase: string;
  interval: string;
  bandwidth: string;
};

const toFormState = (params: StoredSignalParams): FormState => ({
  start: String(params.a),
  end: String(params.b),
  waveform: params.signalShape,
  amplitude: String(params.amplitude),
  frequency: String(params.frequency),
  phase: String(params.phase),
  interval: String(params.interval),
  bandwidth: String(params.freqrange),
});

const toStoredSignalParams = (form: FormState): StoredSignalParams => ({
  a: form.start,
  b: form.end,
  signalShape: form.waveform,
  amplitude: form.amplitude,
  frequency: form.frequency,
  phase: form.phase,
  interval: form.interval,
  freqrange: form.bandwidth,
});

const getMaxBandwidth = (start: string, end: string, interval: string): number => {
  const a = parseFloat(start);
  const b = parseFloat(end);
  const currentInterval = parseFloat(interval);

  if (isNaN(a) || isNaN(b) || isNaN(currentInterval) || currentInterval <= 0) {
    return 50;
  }

  return calculateDynamicMax(a, b, currentInterval);
};

const clampBandwidth = (bandwidth: string, maxBandwidth: number): string => {
  const value = parseFloat(bandwidth);

  if (isNaN(value)) {
    return bandwidth;
  }

  return Math.min(value, maxBandwidth).toString();
};

const displayTextClass = 'font-mono text-xs font-bold tracking-widest uppercase';
const bodyTextClass = 'font-mono text-xs leading-relaxed';
const controlTextClass = 'font-mono text-xs font-medium tracking-[0.12em] uppercase';

const getFrequencyTooltip = (shape: WaveformShape): string => {
  switch (shape) {
    case 'square':
      return 'Sets the width of the square pulse.';
    case 'triangle':
      return 'Sets the base width of the triangle pulse.';
    case 'exp':
    case 'sign':
      return 'This field is currently ignored for the selected waveform.';
    default:
      return 'Controls how quickly the function oscillates across the interval.';
  }
};

const getPhaseTooltip = (shape: WaveformShape): string => {
  switch (shape) {
    case 'square':
    case 'triangle':
      return 'Shifts the waveform left or right on the x-axis.';
    case 'exp':
    case 'sign':
      return 'This field is currently ignored for the selected waveform.';
    default:
      return 'Offsets the waveform horizontally within each cycle.';
  }
};

function ParameterLabel({
  htmlFor,
  tooltip,
  children,
}: {
  htmlFor: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <FieldLabel htmlFor={htmlFor} className={cn(displayTextClass, 'text-neutral-400')}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="cursor-help underline decoration-dotted underline-offset-4 outline-none focus-visible:text-neutral-200"
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="border-neutral-700/50 bg-neutral-950 text-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        >
          <p className={cn(bodyTextClass, 'max-w-52 text-neutral-200')}>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </FieldLabel>
  );
}

export function WaveformGenerator() {
  const { generateSignal, isLoading } = useSignal();
  const [storedForm, setStoredForm] = useLocalStorage<StoredSignalParams>(
    STORAGE_KEY,
    DEFAULT_PARAMS,
    { initializeWithValue: false }
  );
  const form = toFormState(storedForm);

  // Dynamic labels based on waveform
  const frequencyLabel = getFrequencyLabel(form.waveform);
  const phaseLabel = getPhaseLabel(form.waveform);
  const maxBandwidth = getMaxBandwidth(form.start, form.end, form.interval);

  const updateForm = (updates: Partial<FormState>) => {
    setStoredForm((current) => {
      const next = { ...toFormState(current), ...updates };
      const nextMaxBandwidth = getMaxBandwidth(next.start, next.end, next.interval);

      return toStoredSignalParams({
        ...next,
        bandwidth: clampBandwidth(next.bandwidth, nextMaxBandwidth),
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: SignalParams = {
      a: parseFloat(form.start),
      b: parseFloat(form.end),
      signalShape: form.waveform,
      amplitude: parseFloat(form.amplitude),
      frequency: parseFloat(form.frequency),
      phase: parseFloat(form.phase),
      interval: parseFloat(form.interval),
      freqrange: parseFloat(clampBandwidth(form.bandwidth, maxBandwidth)),
    };

    await generateSignal(params);
  };

  return (
    <TooltipProvider>
      <Card className="text-white border-neutral-700/40 bg-neutral-800/50 backdrop-blur-sm h-full flex flex-col border-none shadow-none rounded-none">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className={cn(displayTextClass, 'text-neutral-100')}>
            Function Generator
          </CardTitle>
          <CardDescription className={cn(displayTextClass, 'text-neutral-500')}>
            Parametrized functions
          </CardDescription>
          <Alert className="mt-4 border-purple-500/30 bg-purple-500/10 text-purple-200 shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]">
            <MousePointer2 />
            <AlertTitle className={cn(displayTextClass, 'text-purple-300')}>
              Canvas Controls
            </AlertTitle>
            <AlertDescription className={cn(bodyTextClass, 'mt-1.5 text-purple-200/70')}>
              To zoom in or zoom out on the graphs use your mouse wheel, two-finger scroll on touchpad or pinch with your fingers on mobile.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <CardContent className="px-6 flex-1 flex flex-col">
            <FieldGroup className="gap-4">
            {/* Row 1: Start and End */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel htmlFor="start" tooltip="Sets where the sampled interval begins.">
                  Start:
                </ParameterLabel>
                <Input
                  type="number"
                  id="start"
                  value={form.start}
                  onChange={(e) => updateForm({ start: e.target.value })}
                  step="0.1"
                  min="-50"
                  max="-1"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
              <Field>
                <ParameterLabel htmlFor="end" tooltip="Sets where the sampled interval ends.">
                  End:
                </ParameterLabel>
                <Input
                  type="number"
                  id="end"
                  value={form.end}
                  onChange={(e) => updateForm({ end: e.target.value })}
                  step="0.1"
                  min="1"
                  max="50"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
            </div>

            {/* Row 2: Waveform and Amplitude */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel htmlFor="waveform" tooltip="Chooses which function shape will be generated.">
                  Waveform:
                </ParameterLabel>
                <Select value={form.waveform} onValueChange={(v) => updateForm({ waveform: v as WaveformShape })}>
                  <SelectTrigger
                    id="waveform"
                    className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 font-mono text-xs font-medium tracking-[0.12em] uppercase"
                  >
                    <SelectValue placeholder="Select waveform" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700/50">
                    <SelectItem value="square" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      Square
                    </SelectItem>
                    <SelectItem value="triangle" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      Triangle
                    </SelectItem>
                    <SelectItem value="sinc" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      Sinc
                    </SelectItem>
                    <SelectItem value="cos" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      Cosine
                    </SelectItem>
                    <SelectItem value="sin" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      Sine
                    </SelectItem>
                    <SelectItem value="exp" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      exp
                    </SelectItem>
                    <SelectItem value="sign" className={cn(controlTextClass, 'text-neutral-200 focus:bg-purple-500/20 focus:text-white')}>
                      sign
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <ParameterLabel htmlFor="amplitude" tooltip="Controls the height or strength of the waveform.">
                  Amplitude (A):
                </ParameterLabel>
                <Input
                  type="number"
                  id="amplitude"
                  value={form.amplitude}
                  onChange={(e) => updateForm({ amplitude: e.target.value })}
                  step="0.1"
                  min="-100"
                  max="100"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
            </div>

            {/* Row 3: Frequency and Phase */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel htmlFor="frequency" tooltip={getFrequencyTooltip(form.waveform)}>
                  {frequencyLabel}
                </ParameterLabel>
                <Input
                  type="number"
                  id="frequency"
                  value={form.frequency}
                  onChange={(e) => updateForm({ frequency: e.target.value })}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
              <Field>
                <ParameterLabel htmlFor="phase" tooltip={getPhaseTooltip(form.waveform)}>
                  {phaseLabel}
                </ParameterLabel>
                <Input
                  type="number"
                  id="phase"
                  value={form.phase}
                  onChange={(e) => updateForm({ phase: e.target.value })}
                  step="0.01"
                  min="-100"
                  max="100"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
            </div>

            {/* Row 4: Interval and Frequency Range */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <ParameterLabel htmlFor="interval" tooltip="Sets the sampling step between generated points.">
                  Interval (T):
                </ParameterLabel>
                <Input
                  type="number"
                  id="interval"
                  value={form.interval}
                  onChange={(e) => updateForm({ interval: e.target.value })}
                  step="0.01"
                  min="0.01"
                  max="0.1"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
              <Field>
                <ParameterLabel
                  htmlFor="bandwidth"
                  tooltip="Limits how much of the frequency spectrum is displayed."
                >
                  BW (&lt;= {maxBandwidth} Hz):
                </ParameterLabel>
                <Input
                  type="number"
                  id="bandwidth"
                  value={form.bandwidth}
                  onChange={(e) => updateForm({ bandwidth: e.target.value })}
                  step="0.1"
                  min="0.1"
                  max={maxBandwidth}
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600 font-mono text-xs tracking-[0.12em]"
                />
              </Field>
            </div>
            </FieldGroup>

            {/* Decorative Hardware Interface Panel */}
            <div className="mt-auto mb-auto p-2 rounded-lg bg-[#111111] border border-neutral-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)] flex items-end justify-between relative overflow-hidden">
              {/* Ventilation grill pattern top right */}
              <div className="absolute top-2 right-2 flex gap-1 z-0 opacity-20">
                <div className="w-1 h-6 bg-neutral-950 rounded-full"></div>
                <div className="w-1 h-6 bg-neutral-950 rounded-full"></div>
                <div className="w-1 h-6 bg-neutral-950 rounded-full"></div>
                <div className="w-1 h-6 bg-neutral-950 rounded-full"></div>
              </div>

              <div className="flex flex-col gap-2 z-10 w-full pl-1">
                <div className="flex justify-between items-end w-full">
                  {/* Left Side: Mock Hard Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-1 pointer-events-none">
                    {['Mod', 'Sweep', 'Burst', 'Utility'].map((label) => (
                      <div key={label} className="h-5 w-12 rounded-sm bg-neutral-800 border-b-2 border-neutral-950 border-x border-x-neutral-700 border-t border-t-neutral-600 flex items-center justify-center shadow-sm">
                        <span className="text-[8px] font-mono font-bold text-neutral-400 capitalize tracking-tighter">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Center/Right Side: Hardware Ports (BNC Connectors) */}
                  <div className="flex gap-5 pr-2 pointer-events-none">
                    {/* Active Channel */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-[8px] font-mono font-bold text-purple-400/90 bg-purple-500/10 px-1.5 rounded-[2px] border border-purple-500/30 mb-0.5 shadow-[0_0_5px_rgba(168,85,247,0.2)]">CH 1</div>
                      <div className="h-10 w-10 rounded-full bg-neutral-950 flex items-center justify-center border-[3px] border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2),inset_0_0_10px_rgba(0,0,0,1)] relative">
                        {/* Inner BNC Ring */}
                        <div className="h-[22px] w-[22px] rounded-full bg-neutral-800 border border-neutral-500 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative">
                          {/* Core pin */}
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-100 shadow-[0_0_3px_rgba(255,255,255,0.8)]"></div>
                          {/* Bayonet nubs */}
                          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-neutral-400 rounded-[1px]"></div>
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-neutral-400 rounded-[1px]"></div>
                        </div>
                      </div>
                      <div className="text-[7px] font-mono text-neutral-500 mt-1">50Ω</div>
                    </div>

                    {/* Inactive Channel */}
                    <div className="flex flex-col items-center gap-0.5 opacity-50 relative">
                      <div className="text-[8px] font-mono font-bold text-neutral-400 bg-neutral-800 px-1.5 rounded-[2px] border border-neutral-700 mb-0.5">CH 2</div>
                      <div className="h-10 w-10 rounded-full bg-neutral-950 flex items-center justify-center border-[3px] border-yellow-500/30 shadow-[inset_0_0_10px_rgba(0,0,0,1)] relative">
                        <div className="h-[22px] w-[22px] rounded-full bg-neutral-800 border border-neutral-500 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative">
                          <div className="h-1.5 w-1.5 rounded-full bg-zinc-400"></div>
                          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-neutral-500 rounded-[1px]"></div>
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-neutral-500 rounded-[1px]"></div>
                        </div>
                      </div>
                      <div className="text-[7px] font-mono text-neutral-500 mt-1">HighZ</div>
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
              className="w-full h-9 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50 font-mono text-xs font-bold tracking-widest uppercase"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-t-purple-400 border-purple-400/30 rounded-full animate-spin" />
                  Generating...
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
