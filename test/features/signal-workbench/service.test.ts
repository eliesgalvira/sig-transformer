import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import {
  COMMITTED_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  DEFAULT_SIGNAL_DRAFT,
  getSignalDraftPolicy,
  getSignalChartLegend,
  makeSignalWorkbench,
  SignalWorkbenchAdapters,
  type SignalWorkbenchAdapterShape,
} from "@/features/signal-workbench";
import {
  LocalStorageReadError,
  LocalStorageWriteError,
  SignalDatabaseError,
  SignalGenerationError,
} from "@/features/signal-workbench/errors";
import { computeFFTEffect } from "@/lib/fft/computations";
import type { FFTDataRow } from "@/lib/types/signal";

const cachedRow: FFTDataRow = {
  frequency: 0,
  Freq: 0,
  "re(FFT)": 1,
  "im(FFT)": 0,
  "abs(FFT)": 1,
  input: 0,
  "re(signal)": 1,
};

function makeTestAdapters(options?: {
  readonly rows?: readonly FFTDataRow[];
  readonly storage?: ReadonlyMap<string, unknown>;
}): SignalWorkbenchAdapterShape {
  const storage = new Map(options?.storage ?? []);
  let rows = [...(options?.rows ?? [])];

  return {
    readStorage: (key) =>
      Effect.try({
        try: () => storage.get(key) ?? null,
        catch: (error) => new LocalStorageReadError({ key, error }),
      }),
    writeStorage: (key, value) =>
      Effect.try({
        try: () => void storage.set(key, value),
        catch: (error) => new LocalStorageWriteError({ key, error }),
      }),
    readRows: () =>
      Effect.try({
        try: () => [...rows],
        catch: (error) =>
          new SignalDatabaseError({ operation: "readRows", error }),
      }),
    replaceRows: (nextRows) =>
      Effect.try({
        try: () => {
          rows = [...nextRows];
        },
        catch: (error) =>
          new SignalDatabaseError({ operation: "replaceRows", error }),
      }),
    generateRows: (params) =>
      computeFFTEffect(params).pipe(
        Effect.mapError((error) => new SignalGenerationError({ error })),
      ),
  };
}

const provideTestAdapters = (adapters: SignalWorkbenchAdapterShape) =>
  Effect.provideService(SignalWorkbenchAdapters, adapters);

describe("Signal Workbench", () => {
  it.effect("reuses rows cached for the active Committed Signal", () =>
    Effect.gen(function* () {
      const adapters = makeTestAdapters();
      const workbench = makeSignalWorkbench();

      const generated = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(adapters));
      const cached = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(adapters));

      expect(generated.revision).toBe(1);
      expect(cached.status).toBe("ready");
      expect(cached.revision).toBe(0);
      expect(cached.rows).toEqual(generated.rows);
    }),
  );

  it.effect("regenerates rows when cached data has no matching fingerprint", () =>
    Effect.gen(function* () {
      const adapters = makeTestAdapters({ rows: [cachedRow] });
      const workbench = makeSignalWorkbench();

      const state = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(adapters));

      expect(state.revision).toBe(1);
      expect(state.rows).not.toEqual([cachedRow]);
    }),
  );

  it.effect("keeps generated rows active when the cache write fails", () =>
    Effect.gen(function* () {
      const adapters = makeTestAdapters();
      const failingAdapters = {
        ...adapters,
        replaceRows: () =>
          Effect.fail(
            new SignalDatabaseError({
              operation: "replaceRows",
              error: new Error("cache unavailable"),
            }),
          ),
      } satisfies SignalWorkbenchAdapterShape;
      const workbench = makeSignalWorkbench();

      const state = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(failingAdapters));

      expect(state.status).toBe("ready");
      expect(state.rows.length).toBeGreaterThan(0);
    }),
  );

  it.effect("regenerates rows when the cache cannot be read", () =>
    Effect.gen(function* () {
      const adapters = makeTestAdapters();
      const failingAdapters = {
        ...adapters,
        readRows: () =>
          Effect.fail(
            new SignalDatabaseError({
              operation: "readRows",
              error: new Error("cache unavailable"),
            }),
          ),
      } satisfies SignalWorkbenchAdapterShape;
      const workbench = makeSignalWorkbench();

      const state = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(failingAdapters));

      expect(state.status).toBe("ready");
      expect(state.rows.length).toBeGreaterThan(0);
    }),
  );

  it.effect("generates a Committed Signal when no cached rows exist", () =>
    Effect.gen(function* () {
      const committed = {
        a: -1,
        b: 1,
        signalShape: "sinc",
        amplitude: 1,
        frequency: 1,
        phase: 0,
        interval: 0.1,
        freqrange: 4,
      } as const;
      const storage = new Map<string, unknown>([
        [COMMITTED_STORAGE_KEY, committed],
        [DRAFT_STORAGE_KEY, {
          start: "-1",
          end: "1",
          waveform: "sinc",
          amplitude: "1",
          frequency: "1",
          phase: "0",
          interval: "0.1",
          bandwidth: "4",
        }],
      ]);
      const adapters = makeTestAdapters({ storage });
      const workbench = makeSignalWorkbench();

      const state = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(adapters));

      expect(state.status).toBe("ready");
      expect(state.rows.length).toBeGreaterThan(0);
      expect(state.committedSignal).toEqual(committed);
      expect(state.revision).toBe(1);
    }),
  );

  it.effect("keeps the previous Committed Signal visible while generating", () =>
    Effect.gen(function* () {
      const adapters = makeTestAdapters({ rows: [cachedRow] });
      const workbench = makeSignalWorkbench();
      const ready = yield* workbench
        .bootstrap()
        .pipe(provideTestAdapters(adapters));
      const edited = workbench.transition(ready, {
        type: "draftEdited",
        updates: { amplitude: "2" },
      });
      const generating = workbench.transition(edited, {
        type: "generationStarted",
      });
      const readyChartData = workbench.chartData(ready);

      expect(generating.status).toBe("generating");
      expect(generating.rows).toEqual(ready.rows);
      expect(generating.committedSignal).toEqual(ready.committedSignal);
      expect(workbench.chartData(edited)).toBe(readyChartData);
      expect(workbench.chartData(generating)).toBe(readyChartData);

      const committed = yield* workbench
        .generate(generating)
        .pipe(provideTestAdapters(adapters));

      expect(committed.status).toBe("ready");
      expect(committed.committedSignal.amplitude).toBe(2);
      expect(committed.rows).not.toEqual(ready.rows);
      expect(committed.outputType).toBe("modulus");
      expect(committed.revision).toBe(ready.revision + 1);
    }),
  );
});

describe("Signal Draft policy", () => {
  it("owns dynamic labels, limits, steps, and waveform options", () => {
    const squarePolicy = getSignalDraftPolicy({
      ...DEFAULT_SIGNAL_DRAFT,
      waveform: "square",
    });

    expect(squarePolicy.fields.frequency.label).toBe("Duration (P):");
    expect(squarePolicy.fields.phase.label).toBe("Translate (X):");
    expect(squarePolicy.fields.start).toMatchObject({
      min: -50,
      max: -1,
      step: 0.1,
    });
    expect(squarePolicy.fields.interval).toMatchObject({
      min: 0.01,
      max: 0.1,
      step: 0.01,
    });
    expect(squarePolicy.fields.bandwidth.max).toBeGreaterThan(0);
    expect(squarePolicy.waveform.options.map((option) => option.value)).toEqual([
      "square",
      "triangle",
      "sinc",
      "cos",
      "sin",
      "exp",
      "sign",
    ]);
  });
});

describe("Signal chart presentation", () => {
  it("preserves MathJax commands in localized legends", () => {
    const legend = getSignalChartLegend(
      {
        a: -1,
        b: 1,
        signalShape: "sinc",
        amplitude: 1,
        frequency: 1,
        phase: 0,
        interval: 0.1,
        freqrange: 4,
      },
      "modulus",
    );

    expect(legend.inputSymbolName).toContain("\\textbf{x}");
    expect(legend.inputSymbolName.startsWith("\\(")).toBe(true);
    expect(legend.outputSymbolName).toContain("\\mathcal{F}");
  });
});
