import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
  computeFFTEffect,
} from "@/lib/fft/computations";
import type {
  FFTDataRow,
  SignalParams,
  WaveformShape,
} from "@/lib/types/signal";

type NamedCase = {
  readonly shape: WaveformShape;
  readonly params: SignalParams;
};

const defaultParams = {
  a: -2,
  b: 2,
  amplitude: 1,
  frequency: 1,
  phase: 0,
  interval: 0.25,
  freqrange: 4,
} satisfies Omit<SignalParams, "signalShape">;

const namedCases: ReadonlyArray<NamedCase> = [
  {
    shape: "square",
    params: {
      ...defaultParams,
      signalShape: "square",
      amplitude: 1.5,
      frequency: 1.5,
    },
  },
  {
    shape: "triangle",
    params: {
      ...defaultParams,
      signalShape: "triangle",
      amplitude: 2,
      frequency: 1.5,
    },
  },
  {
    shape: "sinc",
    params: {
      ...defaultParams,
      signalShape: "sinc",
      amplitude: 1.2,
      frequency: 2,
    },
  },
  {
    shape: "cos",
    params: {
      ...defaultParams,
      signalShape: "cos",
      amplitude: 0.75,
      frequency: 1,
      phase: Math.PI / 3,
    },
  },
  {
    shape: "sin",
    params: {
      ...defaultParams,
      signalShape: "sin",
      amplitude: 1.25,
      frequency: 1,
      phase: Math.PI / 4,
    },
  },
  {
    shape: "exp",
    params: {
      ...defaultParams,
      signalShape: "exp",
      a: -1,
      b: 1,
      amplitude: 0.5,
    },
  },
  {
    shape: "sign",
    params: {
      ...defaultParams,
      signalShape: "sign",
    },
  },
];

const evenShapeCases: ReadonlyArray<SignalParams> = [
  {
    ...defaultParams,
    signalShape: "square",
    amplitude: 1.5,
    frequency: 1.5,
  },
  {
    ...defaultParams,
    signalShape: "triangle",
    amplitude: 2,
    frequency: 1.5,
  },
  {
    ...defaultParams,
    signalShape: "sinc",
    amplitude: 1.2,
    frequency: 2,
  },
  {
    ...defaultParams,
    signalShape: "cos",
    amplitude: 0.75,
    frequency: 1,
  },
];

const oddShapeCases: ReadonlyArray<SignalParams> = [
  {
    ...defaultParams,
    signalShape: "sin",
    amplitude: 1.25,
    frequency: 1,
  },
  {
    ...defaultParams,
    signalShape: "sign",
  },
];

function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) {
    p <<= 1;
  }
  return p;
}

function roundLikeApp(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function approximatelyZero(value: number): boolean {
  return Math.abs(value) <= 1e-12;
}

function sampleSignalValue(params: SignalParams, time: number): number {
  const { amplitude, frequency, phase, signalShape } = params;
  const centeredTime = approximatelyZero(time) ? 0 : time;

  switch (signalShape) {
    case "square":
      return Math.abs(centeredTime - phase) <=
        frequency / 2 + params.interval / 2
        ? amplitude
        : 0;
    case "triangle":
      return (
        amplitude * Math.max(0, 1 - Math.abs(centeredTime - phase) / frequency)
      );
    case "sinc": {
      const denominator = frequency * Math.PI * centeredTime - phase;
      return approximatelyZero(denominator)
        ? amplitude
        : (amplitude * Math.sin(denominator)) / denominator;
    }
    case "cos":
      return (
        amplitude * Math.cos(2 * Math.PI * frequency * centeredTime + phase)
      );
    case "sin":
      return (
        amplitude * Math.sin(2 * Math.PI * frequency * centeredTime + phase)
      );
    case "exp":
      return amplitude * Math.exp(centeredTime);
    case "sign":
      return approximatelyZero(centeredTime) ? 0 : Math.sign(centeredTime);
    default: {
      const exhaustive: never = signalShape;
      throw new Error(`Unsupported waveform shape: ${exhaustive}`);
    }
  }
}

function createReferenceRows(params: SignalParams): FFTDataRow[] {
  if (!(params.b - params.a > 0)) {
    throw new Error("Invalid interval: b - a must be > 0");
  }

  const totalSamples = Math.ceil((params.b - params.a) / params.interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);
  const center = Math.floor(paddedSize / 2);

  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i += 1) {
    const time = params.a + i * params.interval;
    timeValues[i] = time;
    signalValues[i] = sampleSignalValue(params, time);
  }

  const rows: FFTDataRow[] = [];

  for (let k = 0; k < paddedSize; k += 1) {
    const frequency = (k - center) / (paddedSize * params.interval);
    let re = 0;
    let im = 0;

    for (let i = 0; i < totalSamples; i += 1) {
      const angle = -2 * Math.PI * frequency * timeValues[i]!;
      const sample = signalValues[i]!;
      re += sample * Math.cos(angle);
      im += sample * Math.sin(angle);
    }

    const reScaled = re * params.interval;
    const imScaled = im * params.interval;
    const inputTime = k < totalSamples ? timeValues[k]! : Number.NaN;
    const inputValue = k < totalSamples ? signalValues[k]! : Number.NaN;

    rows.push({
      frequency,
      Freq: roundLikeApp(frequency, 2),
      "re(FFT)": roundLikeApp(reScaled, 5),
      "im(FFT)": roundLikeApp(imScaled, 5),
      "abs(FFT)": roundLikeApp(Math.hypot(reScaled, imScaled), 5),
      input: Number.isFinite(inputTime)
        ? roundLikeApp(inputTime, 5)
        : inputTime,
      "re(signal)": Number.isFinite(inputValue)
        ? roundLikeApp(inputValue, 5)
        : inputValue,
    });
  }

  return rows;
}

function expectRowEqual(actual: FFTDataRow, expected: FFTDataRow): void {
  const entries: ReadonlyArray<Exclude<keyof FFTDataRow, "id">> = [
    "frequency",
    "Freq",
    "re(FFT)",
    "im(FFT)",
    "abs(FFT)",
    "input",
    "re(signal)",
  ];

  for (const key of entries) {
    const actualValue = normalizeZero(actual[key]);
    const expectedValue = normalizeZero(expected[key]);

    if (Number.isNaN(expectedValue)) {
      expect(Number.isNaN(actualValue)).toBe(true);
      continue;
    }

    expect(actualValue).toBe(expectedValue);
  }
}

function maxAbsolute(
  rows: ReadonlyArray<FFTDataRow>,
  key: "re(FFT)" | "im(FFT)",
): number {
  let max = 0;

  for (const row of rows) {
    max = Math.max(max, Math.abs(normalizeZero(row[key])));
  }

  return max;
}

describe("computeFFT", () => {
  for (const testCase of namedCases) {
    it.effect(`matches the direct transform for ${testCase.shape}`, () =>
      Effect.gen(function* () {
        const actualRows = yield* computeFFTEffect(testCase.params);
        const expectedRows = createReferenceRows(testCase.params);

        expect(actualRows).toHaveLength(expectedRows.length);

        for (let index = 0; index < actualRows.length; index += 1) {
          expectRowEqual(actualRows[index]!, expectedRows[index]!);
        }
      }),
    );
  }

  for (const params of evenShapeCases) {
    it.effect(
      `keeps the imaginary spectrum at numerical zero for centered ${params.signalShape}`,
      () =>
        Effect.gen(function* () {
          const rows = yield* computeFFTEffect(params);

          expect(maxAbsolute(rows, "im(FFT)")).toBe(0);
        }),
    );
  }

  for (const params of oddShapeCases) {
    it.effect(
      `keeps the real spectrum at numerical zero for centered ${params.signalShape}`,
      () =>
        Effect.gen(function* () {
          const rows = yield* computeFFTEffect(params);

          expect(maxAbsolute(rows, "re(FFT)")).toBe(0);
        }),
    );
  }

  it.effect("keeps raw frequencies unique for the largest allowed interval", () =>
    Effect.gen(function* () {
      const rows = yield* computeFFTEffect({
        a: -50,
        b: 50,
        signalShape: "sinc",
        amplitude: 1,
        frequency: 1,
        phase: 0,
        interval: 0.01,
        freqrange: 4,
      });

      expect(rows).toHaveLength(16_384);
      expect(new Set(rows.map((row) => row.frequency)).size).toBe(rows.length);
      expect(new Set(rows.map((row) => row.Freq)).size).toBeLessThan(
        rows.length,
      );
    }),
  );
});
