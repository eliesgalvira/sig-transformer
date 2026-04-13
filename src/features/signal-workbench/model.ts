import { Schema } from 'effect';
import { DEFAULT_PARAMS, type OutputType, type SignalParams, type WaveformShape } from '@/lib/types/signal';
import { InvalidSignalDraftError } from './errors';

export const LEGACY_STORAGE_KEY = 'signalParams';
export const DRAFT_STORAGE_KEY = 'signalWorkbench:draft';
export const COMMITTED_STORAGE_KEY = 'signalWorkbench:committed';

const NumericLikeSchema = Schema.Union([Schema.String, Schema.Number]);

export const WaveformShapeSchema = Schema.Literals([
  'square',
  'triangle',
  'sinc',
  'cos',
  'sin',
  'exp',
  'sign',
]);

export const OutputTypeSchema = Schema.Literals(['modulus', 'real', 'imaginary']);

const StoredSignalParamsSchema = Schema.Struct({
  a: NumericLikeSchema,
  b: NumericLikeSchema,
  signalShape: WaveformShapeSchema,
  amplitude: NumericLikeSchema,
  frequency: NumericLikeSchema,
  phase: NumericLikeSchema,
  interval: NumericLikeSchema,
  freqrange: NumericLikeSchema,
});

const StoredSignalDraftSchema = Schema.Struct({
  start: NumericLikeSchema,
  end: NumericLikeSchema,
  waveform: WaveformShapeSchema,
  amplitude: NumericLikeSchema,
  frequency: NumericLikeSchema,
  phase: NumericLikeSchema,
  interval: NumericLikeSchema,
  bandwidth: NumericLikeSchema,
});

export interface SignalDraft {
  start: string;
  end: string;
  waveform: WaveformShape;
  amplitude: string;
  frequency: string;
  phase: string;
  interval: string;
  bandwidth: string;
}

export interface SignalBootstrap {
  draft: SignalDraft;
  signalParams: SignalParams;
  generatedOnBoot: boolean;
}

export const DEFAULT_SIGNAL_DRAFT: SignalDraft = toSignalDraft(DEFAULT_PARAMS);

function parseStoredNumber(field: string, value: string | number): number {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new InvalidSignalDraftError({
      field,
      message: `${field} must be a finite number.`,
    });
  }
  return parsed;
}

export function toSignalDraft(params: SignalParams): SignalDraft {
  return {
    start: String(params.a),
    end: String(params.b),
    waveform: params.signalShape,
    amplitude: String(params.amplitude),
    frequency: String(params.frequency),
    phase: String(params.phase),
    interval: String(params.interval),
    bandwidth: String(params.freqrange),
  };
}

export function decodeStoredSignalParams(input: unknown): SignalParams {
  const stored = Schema.decodeUnknownSync(StoredSignalParamsSchema)(input);

  return {
    a: parseStoredNumber('start', stored.a),
    b: parseStoredNumber('end', stored.b),
    signalShape: stored.signalShape,
    amplitude: parseStoredNumber('amplitude', stored.amplitude),
    frequency: parseStoredNumber('frequency', stored.frequency),
    phase: parseStoredNumber('phase', stored.phase),
    interval: parseStoredNumber('interval', stored.interval),
    freqrange: parseStoredNumber('bandwidth', stored.freqrange),
  };
}

export function decodeStoredSignalDraft(input: unknown): SignalDraft {
  try {
    const storedDraft = Schema.decodeUnknownSync(StoredSignalDraftSchema)(input);

    return sanitizeSignalDraft({
      start: String(storedDraft.start),
      end: String(storedDraft.end),
      waveform: storedDraft.waveform,
      amplitude: String(storedDraft.amplitude),
      frequency: String(storedDraft.frequency),
      phase: String(storedDraft.phase),
      interval: String(storedDraft.interval),
      bandwidth: String(storedDraft.bandwidth),
    });
  } catch {
    return sanitizeSignalDraft(toSignalDraft(decodeStoredSignalParams(input)));
  }
}

export function getMaxBandwidth(start: string, end: string, interval: string): number {
  const a = parseFloat(start);
  const b = parseFloat(end);
  const currentInterval = parseFloat(interval);

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(currentInterval) || currentInterval <= 0) {
    return 50;
  }

  const totalSamples = Math.ceil((b - a) / currentInterval);
  return Math.floor(
    (10 * (totalSamples - Math.round(totalSamples / 2))) / (totalSamples * currentInterval)
  ) / 10;
}

export function clampBandwidth(bandwidth: string, maxBandwidth: number): string {
  const value = parseFloat(bandwidth);

  if (!Number.isFinite(value)) {
    return bandwidth;
  }

  return Math.min(value, maxBandwidth).toString();
}

export function sanitizeSignalDraft(draft: SignalDraft): SignalDraft {
  const maxBandwidth = getMaxBandwidth(draft.start, draft.end, draft.interval);

  return {
    ...draft,
    bandwidth: clampBandwidth(draft.bandwidth, maxBandwidth),
  };
}

export function mergeSignalDraft(
  current: SignalDraft,
  updates: Partial<SignalDraft>
): SignalDraft {
  return sanitizeSignalDraft({
    ...current,
    ...updates,
  });
}

export function decodeDraftToSignalParams(draft: SignalDraft): SignalParams {
  const sanitizedDraft = sanitizeSignalDraft(draft);
  const params: SignalParams = {
    a: parseStoredNumber('start', sanitizedDraft.start),
    b: parseStoredNumber('end', sanitizedDraft.end),
    signalShape: sanitizedDraft.waveform,
    amplitude: parseStoredNumber('amplitude', sanitizedDraft.amplitude),
    frequency: parseStoredNumber('frequency', sanitizedDraft.frequency),
    phase: parseStoredNumber('phase', sanitizedDraft.phase),
    interval: parseStoredNumber('interval', sanitizedDraft.interval),
    freqrange: parseStoredNumber('bandwidth', sanitizedDraft.bandwidth),
  };

  if (!(params.b - params.a > 0)) {
    throw new InvalidSignalDraftError({
      field: 'interval-range',
      message: 'End must be greater than Start.',
    });
  }

  if (!(params.interval > 0)) {
    throw new InvalidSignalDraftError({
      field: 'interval',
      message: 'Interval must be greater than 0.',
    });
  }

  return params;
}

export function getFrequencyLabel(shape: WaveformShape): string {
  switch (shape) {
    case 'square':
      return 'Duration (P):';
    case 'triangle':
      return 'Duration (2P):';
    default:
      return 'Frequency (f₀):';
  }
}

export function getPhaseLabel(shape: WaveformShape): string {
  switch (shape) {
    case 'square':
    case 'triangle':
      return 'Translate (X):';
    default:
      return 'Phase (ϕ):';
  }
}

export function getFrequencyTooltip(shape: WaveformShape): string {
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
}

export function getPhaseTooltip(shape: WaveformShape): string {
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
}

export function normalizeOutputType(value: string): OutputType {
  return Schema.decodeUnknownSync(OutputTypeSchema)(value);
}
