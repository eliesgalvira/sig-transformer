import * as Schema from "effect/Schema";
import {
  DEFAULT_PARAMS,
  type FFTDataRow,
  type OutputType,
  type SignalParams,
  type WaveformShape,
} from "@/lib/types/signal";
import { InvalidSignalDraftError } from "./errors";

export const LEGACY_STORAGE_KEY = "signalParams";
export const DRAFT_STORAGE_KEY = "signalWorkbench:draft";
export const COMMITTED_STORAGE_KEY = "signalWorkbench:committed";
export const ROW_CACHE_STORAGE_KEY = "signalWorkbench:row-cache";

const NumericLikeSchema = Schema.Union([Schema.String, Schema.Number]);

export const WaveformShapeSchema = Schema.Literals([
  "square",
  "triangle",
  "sinc",
  "cos",
  "sin",
  "exp",
  "sign",
]);

export const OutputTypeSchema = Schema.Literals([
  "modulus",
  "real",
  "imaginary",
]);

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

const SIGNAL_PARAM_LIMITS = {
  start: { min: -50, max: -1 },
  end: { min: 1, max: 50 },
  amplitude: { min: -100, max: 100 },
  frequency: { min: 0.1, max: 50 },
  phase: { min: -100, max: 100 },
  interval: { min: 0.01, max: 0.1 },
  maxPaddedFftSize: 16_384,
} as const;

export const WAVEFORM_OPTIONS = [
  { value: "square", label: "Square" },
  { value: "triangle", label: "Triangle" },
  { value: "sinc", label: "Sinc" },
  { value: "cos", label: "Cosine" },
  { value: "sin", label: "Sine" },
  { value: "exp", label: "exp" },
  { value: "sign", label: "sign" },
] as const satisfies ReadonlyArray<{
  readonly value: WaveformShape;
  readonly label: string;
}>;

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

export type NumericSignalDraftField = Exclude<keyof SignalDraft, "waveform">;

export interface NumericSignalDraftFieldPolicy {
  readonly label: string;
  readonly tooltip: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface SignalDraftPolicy {
  readonly fields: Record<
    NumericSignalDraftField,
    NumericSignalDraftFieldPolicy
  >;
  readonly waveform: {
    readonly label: string;
    readonly tooltip: string;
    readonly options: typeof WAVEFORM_OPTIONS;
  };
}

interface SignalWorkbenchSnapshot {
  draft: SignalDraft;
  committedSignal: SignalParams;
  rows: readonly FFTDataRow[];
  outputType: OutputType;
  revision: number;
}

export type SignalWorkbenchState = SignalWorkbenchSnapshot &
  (
    | { readonly status: "booting"; readonly errorMessage: null }
    | { readonly status: "ready"; readonly errorMessage: null }
    | { readonly status: "generating"; readonly errorMessage: null }
    | { readonly status: "error"; readonly errorMessage: string }
  );

export const DEFAULT_SIGNAL_DRAFT: SignalDraft = toSignalDraft(DEFAULT_PARAMS);

export const INITIAL_SIGNAL_WORKBENCH_STATE: SignalWorkbenchState = {
  status: "booting",
  errorMessage: null,
  draft: DEFAULT_SIGNAL_DRAFT,
  committedSignal: DEFAULT_PARAMS,
  rows: [],
  outputType: "modulus",
  revision: 0,
};

function parseStoredNumber(field: string, value: string | number): number {
  const parsed =
    typeof value === "number"
      ? value
      : value.trim() === ""
        ? Number.NaN
        : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new InvalidSignalDraftError({
      field,
      message: `${field} must be a finite number.`,
    });
  }
  return parsed;
}

function assertBetween(
  field: string,
  value: number,
  bounds: { readonly min: number; readonly max: number },
): void {
  if (value < bounds.min || value > bounds.max) {
    throw new InvalidSignalDraftError({
      field,
      message: `${field} must be between ${bounds.min} and ${bounds.max}.`,
    });
  }
}

function assertSignalParamsWithinDomain(params: SignalParams): void {
  assertBetween("start", params.a, SIGNAL_PARAM_LIMITS.start);
  assertBetween("end", params.b, SIGNAL_PARAM_LIMITS.end);
  assertBetween("amplitude", params.amplitude, SIGNAL_PARAM_LIMITS.amplitude);
  assertBetween("frequency", params.frequency, SIGNAL_PARAM_LIMITS.frequency);
  assertBetween("phase", params.phase, SIGNAL_PARAM_LIMITS.phase);
  assertBetween("interval", params.interval, SIGNAL_PARAM_LIMITS.interval);

  if (params.b - params.a <= 0) {
    throw new InvalidSignalDraftError({
      field: "interval-range",
      message: "End must be greater than Start.",
    });
  }

  const maxBandwidth = getMaxBandwidth(
    String(params.a),
    String(params.b),
    String(params.interval),
  );

  if (params.freqrange < 0.1 || params.freqrange > maxBandwidth) {
    throw new InvalidSignalDraftError({
      field: "bandwidth",
      message: `bandwidth must be between 0.1 and ${maxBandwidth}.`,
    });
  }

  const totalSamples = Math.ceil((params.b - params.a) / params.interval) + 1;
  const paddedSize = 2 ** Math.ceil(Math.log2(Math.max(totalSamples, 1)));

  if (paddedSize > SIGNAL_PARAM_LIMITS.maxPaddedFftSize) {
    throw new InvalidSignalDraftError({
      field: "interval",
      message: "The selected range and interval generate too many samples.",
    });
  }
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
    a: parseStoredNumber("start", stored.a),
    b: parseStoredNumber("end", stored.b),
    signalShape: stored.signalShape,
    amplitude: parseStoredNumber("amplitude", stored.amplitude),
    frequency: parseStoredNumber("frequency", stored.frequency),
    phase: parseStoredNumber("phase", stored.phase),
    interval: parseStoredNumber("interval", stored.interval),
    freqrange: parseStoredNumber("bandwidth", stored.freqrange),
  };
}

export function decodeStoredSignalDraft(input: unknown): SignalDraft {
  try {
    const storedDraft = Schema.decodeUnknownSync(StoredSignalDraftSchema)(
      input,
    );

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

export function getMaxBandwidth(
  start: string,
  end: string,
  interval: string,
): number {
  const a = parseFloat(start);
  const b = parseFloat(end);
  const currentInterval = parseFloat(interval);

  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    !Number.isFinite(currentInterval) ||
    currentInterval <= 0
  ) {
    return 50;
  }

  const totalSamples = Math.ceil((b - a) / currentInterval);
  return (
    Math.floor(
      (10 * (totalSamples - Math.round(totalSamples / 2))) /
        (totalSamples * currentInterval),
    ) / 10
  );
}

export function clampBandwidth(
  bandwidth: string,
  maxBandwidth: number,
): string {
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
  updates: Partial<SignalDraft>,
): SignalDraft {
  return sanitizeSignalDraft({
    ...current,
    ...updates,
  });
}

export function decodeDraftToSignalParams(draft: SignalDraft): SignalParams {
  const sanitizedDraft = sanitizeSignalDraft(draft);
  const params: SignalParams = {
    a: parseStoredNumber("start", sanitizedDraft.start),
    b: parseStoredNumber("end", sanitizedDraft.end),
    signalShape: sanitizedDraft.waveform,
    amplitude: parseStoredNumber("amplitude", sanitizedDraft.amplitude),
    frequency: parseStoredNumber("frequency", sanitizedDraft.frequency),
    phase: parseStoredNumber("phase", sanitizedDraft.phase),
    interval: parseStoredNumber("interval", sanitizedDraft.interval),
    freqrange: parseStoredNumber("bandwidth", sanitizedDraft.bandwidth),
  };

  if (params.b - params.a <= 0) {
    throw new InvalidSignalDraftError({
      field: "interval-range",
      message: "End must be greater than Start.",
    });
  }

  if (params.interval <= 0) {
    throw new InvalidSignalDraftError({
      field: "interval",
      message: "Interval must be greater than 0.",
    });
  }

  assertSignalParamsWithinDomain(params);

  return params;
}

export function getFrequencyLabel(shape: WaveformShape): string {
  switch (shape) {
    case "square":
      return "Duration (P):";
    case "triangle":
      return "Duration (2P):";
    default:
      return "Frequency (f₀):";
  }
}

export function getPhaseLabel(shape: WaveformShape): string {
  switch (shape) {
    case "square":
    case "triangle":
      return "Translate (X):";
    default:
      return "Phase (ϕ):";
  }
}

export function getFrequencyTooltip(shape: WaveformShape): string {
  switch (shape) {
    case "square":
      return "Sets the width of the square pulse.";
    case "triangle":
      return "Sets the base width of the triangle pulse.";
    case "exp":
    case "sign":
      return "This field is currently ignored for the selected waveform.";
    default:
      return "Controls how quickly the function oscillates across the interval.";
  }
}

export function getPhaseTooltip(shape: WaveformShape): string {
  switch (shape) {
    case "square":
    case "triangle":
      return "Shifts the waveform left or right on the x-axis.";
    case "exp":
    case "sign":
      return "This field is currently ignored for the selected waveform.";
    default:
      return "Offsets the waveform horizontally within each cycle.";
  }
}

export function getSignalDraftPolicy(draft: SignalDraft): SignalDraftPolicy {
  const maxBandwidth = getMaxBandwidth(
    draft.start,
    draft.end,
    draft.interval,
  );

  return {
    fields: {
      start: {
        label: "Start:",
        tooltip: "Sets where the sampled interval begins.",
        ...SIGNAL_PARAM_LIMITS.start,
        step: 0.1,
      },
      end: {
        label: "End:",
        tooltip: "Sets where the sampled interval ends.",
        ...SIGNAL_PARAM_LIMITS.end,
        step: 0.1,
      },
      amplitude: {
        label: "Amplitude (A):",
        tooltip: "Controls the height or strength of the waveform.",
        ...SIGNAL_PARAM_LIMITS.amplitude,
        step: 0.1,
      },
      frequency: {
        label: getFrequencyLabel(draft.waveform),
        tooltip: getFrequencyTooltip(draft.waveform),
        ...SIGNAL_PARAM_LIMITS.frequency,
        step: 0.1,
      },
      phase: {
        label: getPhaseLabel(draft.waveform),
        tooltip: getPhaseTooltip(draft.waveform),
        ...SIGNAL_PARAM_LIMITS.phase,
        step: 0.01,
      },
      interval: {
        label: "Interval (T):",
        tooltip: "Sets the sampling step between generated points.",
        ...SIGNAL_PARAM_LIMITS.interval,
        step: 0.01,
      },
      bandwidth: {
        label: `BW (<= ${maxBandwidth} Hz):`,
        tooltip: "Limits how much of the frequency spectrum is displayed.",
        min: 0.1,
        max: maxBandwidth,
        step: 0.1,
      },
    },
    waveform: {
      label: "Waveform:",
      tooltip: "Chooses which function shape will be generated.",
      options: WAVEFORM_OPTIONS,
    },
  };
}

export function normalizeOutputType(value: string): OutputType {
  return Schema.decodeUnknownSync(OutputTypeSchema)(value);
}
