import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { getAllSignals, loadJSONToIndexedDB } from "@/lib/db";
import { computeFFTEffect } from "@/lib/fft/computations";
import type {
  FFTDataRow,
  OutputType,
  SignalData,
  SignalParams,
} from "@/lib/types/signal";
import {
  COMMITTED_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  ROW_CACHE_STORAGE_KEY,
  DEFAULT_SIGNAL_DRAFT,
  INITIAL_SIGNAL_WORKBENCH_STATE,
  type SignalDraft,
  type SignalWorkbenchState,
  decodeDraftToSignalParams,
  decodeStoredSignalDraft,
  decodeStoredSignalParams,
  mergeSignalDraft,
  toSignalDraft,
} from "./model";
import {
  InvalidStoredSignalParamsError,
  InvalidSignalDraftError,
  LocalStorageReadError,
  LocalStorageWriteError,
  SignalDatabaseError,
  SignalGenerationError,
  type WorkbenchError,
} from "./errors";
import { rowsToSignalData } from "./selectors";

const JsonValueFromString = Schema.fromJsonString(Schema.Unknown);

export interface SignalWorkbenchAdapterShape {
  readonly readStorage: (
    key: string,
  ) => Effect.Effect<unknown | null, LocalStorageReadError>;
  readonly writeStorage: (
    key: string,
    value: unknown,
  ) => Effect.Effect<void, LocalStorageWriteError>;
  readonly readRows: () => Effect.Effect<
    readonly FFTDataRow[],
    SignalDatabaseError
  >;
  readonly replaceRows: (
    rows: readonly FFTDataRow[],
  ) => Effect.Effect<void, SignalDatabaseError>;
  readonly generateRows: (
    params: SignalParams,
  ) => Effect.Effect<readonly FFTDataRow[], SignalGenerationError>;
}

export class SignalWorkbenchAdapters extends Context.Service<
  SignalWorkbenchAdapters,
  SignalWorkbenchAdapterShape
>()("sig-transformer/features/signal-workbench/service/SignalWorkbenchAdapters") {}

export type SignalWorkbenchEvent =
  | {
      readonly type: "draftEdited";
      readonly updates: Partial<SignalDraft>;
    }
  | { readonly type: "generationStarted" }
  | { readonly type: "outputSelected"; readonly outputType: OutputType }
  | { readonly type: "failed"; readonly message: string };

function logNonBlockingError(error: WorkbenchError): Effect.Effect<void> {
  switch (error._tag) {
    case "InvalidStoredSignalParamsError":
      return Effect.logWarning(
        `[signal-workbench] ignoring invalid stored state for "${error.key}"`,
      );
    case "LocalStorageReadError":
    case "LocalStorageWriteError":
      return Effect.logWarning(
        `[signal-workbench] storage access issue for "${error.key}"`,
      );
    default:
      return Effect.logError(`[signal-workbench] ${error._tag}`, error);
  }
}

function decodeStoredParamsEffect(key: string, value: unknown) {
  return Effect.try({
    try: () => decodeStoredSignalParams(value),
    catch: (error) => new InvalidStoredSignalParamsError({ key, error }),
  });
}

function decodeStoredDraftEffect(key: string, value: unknown) {
  return Effect.try({
    try: () => decodeStoredSignalDraft(value),
    catch: (error) => new InvalidStoredSignalParamsError({ key, error }),
  });
}

function decodeDraftEffect(draft: SignalDraft) {
  return Effect.try({
    try: () => decodeDraftToSignalParams(draft),
    catch: (error) =>
      Schema.is(InvalidSignalDraftError)(error)
        ? error
        : new InvalidSignalDraftError({
            field: "form",
            message: "The signal form contains invalid values.",
          }),
  });
}

function getSignalFingerprint(params: SignalParams): string {
  return JSON.stringify([
    params.a,
    params.b,
    params.signalShape,
    params.amplitude,
    params.frequency,
    params.phase,
    params.interval,
    params.freqrange,
  ]);
}

export function makeSignalWorkbench() {
  const ignorePersistenceFailure = (
    effect: Effect.Effect<void, LocalStorageReadError | LocalStorageWriteError>,
  ) =>
    effect.pipe(
      Effect.catchTag("LocalStorageReadError", logNonBlockingError),
      Effect.catchTag("LocalStorageWriteError", logNonBlockingError),
    );

  const readStorageOrNull = Effect.fn("signalWorkbench.readStorageOrNull")(
    function* (key: string) {
      const adapters = yield* SignalWorkbenchAdapters;
      return yield* adapters.readStorage(key).pipe(
        Effect.catchTag("LocalStorageReadError", (error) =>
          Effect.gen(function* () {
            yield* logNonBlockingError(error);
            return null;
          }),
        ),
      );
    },
  );

  const readStoredParamsOrElse = Effect.fn(
    "signalWorkbench.readStoredParamsOrElse",
  )(function* (key: string, fallback: SignalParams) {
    const storedValue = yield* readStorageOrNull(key);

    if (storedValue === null) {
      return fallback;
    }

    return yield* decodeStoredParamsEffect(key, storedValue).pipe(
      Effect.catchTag("InvalidStoredSignalParamsError", (error) =>
        Effect.gen(function* () {
          yield* logNonBlockingError(error);
          return fallback;
        }),
      ),
    );
  });

  const readStoredDraftOrElse = Effect.fn(
    "signalWorkbench.readStoredDraftOrElse",
  )(function* (key: string, fallback: SignalDraft) {
    const storedValue = yield* readStorageOrNull(key);

    if (storedValue === null) {
      return fallback;
    }

    return yield* decodeStoredDraftEffect(key, storedValue).pipe(
      Effect.catchTag("InvalidStoredSignalParamsError", (error) =>
        Effect.gen(function* () {
          yield* logNonBlockingError(error);
          return fallback;
        }),
      ),
    );
  });

  const persistRowsCache = Effect.fn("signalWorkbench.persistRowsCache")(
    function* (rows: readonly FFTDataRow[], params: SignalParams) {
      const adapters = yield* SignalWorkbenchAdapters;
      yield* adapters.replaceRows(rows).pipe(
        Effect.flatMap(() =>
          ignorePersistenceFailure(
            adapters.writeStorage(
              ROW_CACHE_STORAGE_KEY,
              getSignalFingerprint(params),
            ),
          ),
        ),
        Effect.catchTag("SignalDatabaseError", logNonBlockingError),
      );
    },
  );

  const bootstrap = Effect.fn("signalWorkbench.bootstrap")(function* () {
    const adapters = yield* SignalWorkbenchAdapters;
    const defaultParams = decodeDraftToSignalParams(DEFAULT_SIGNAL_DRAFT);
    const legacyParams = yield* readStoredParamsOrElse(
      LEGACY_STORAGE_KEY,
      defaultParams,
    );
    const committedSignal = yield* readStoredParamsOrElse(
      COMMITTED_STORAGE_KEY,
      legacyParams,
    );
    const draft = yield* readStoredDraftOrElse(
      DRAFT_STORAGE_KEY,
      toSignalDraft(committedSignal),
    );
    const cachedFingerprint = yield* readStorageOrNull(ROW_CACHE_STORAGE_KEY);
    const cachedRows = yield* adapters.readRows().pipe(
      Effect.catchTag("SignalDatabaseError", (error) =>
        Effect.gen(function* () {
          yield* logNonBlockingError(error);
          return [] as readonly FFTDataRow[];
        }),
      ),
    );
    const generatedOnBoot =
      cachedRows.length === 0 ||
      cachedFingerprint !== getSignalFingerprint(committedSignal);
    const rows = generatedOnBoot
      ? yield* adapters.generateRows(committedSignal)
      : cachedRows;

    if (generatedOnBoot) {
      yield* persistRowsCache(rows, committedSignal);
    }

    yield* ignorePersistenceFailure(
      adapters.writeStorage(COMMITTED_STORAGE_KEY, committedSignal),
    );
    yield* ignorePersistenceFailure(
      adapters.writeStorage(DRAFT_STORAGE_KEY, draft),
    );

    return {
      status: "ready",
      errorMessage: null,
      draft,
      committedSignal,
      rows,
      outputType: "modulus",
      revision: generatedOnBoot ? 1 : 0,
    } satisfies SignalWorkbenchState;
  });

  const persistDraft = Effect.fn("signalWorkbench.persistDraft")(function* (
    draft: SignalDraft,
  ) {
    const adapters = yield* SignalWorkbenchAdapters;
    yield* ignorePersistenceFailure(
      adapters.writeStorage(DRAFT_STORAGE_KEY, draft),
    );
  });

  const generate = Effect.fn("signalWorkbench.generate")(function* (
    state: SignalWorkbenchState,
  ) {
    const adapters = yield* SignalWorkbenchAdapters;
    const committedSignal = yield* decodeDraftEffect(state.draft);
    const rows = yield* adapters.generateRows(committedSignal);
    const draft = toSignalDraft(committedSignal);

    yield* ignorePersistenceFailure(
      adapters.writeStorage(DRAFT_STORAGE_KEY, draft),
    );
    yield* ignorePersistenceFailure(
      adapters.writeStorage(COMMITTED_STORAGE_KEY, committedSignal),
    );
    yield* persistRowsCache(rows, committedSignal);

    return {
      status: "ready",
      errorMessage: null,
      draft,
      committedSignal,
      rows,
      outputType: "modulus",
      revision: state.revision + 1,
    } satisfies SignalWorkbenchState;
  });

  const transition = (
    state: SignalWorkbenchState,
    event: SignalWorkbenchEvent,
  ): SignalWorkbenchState => {
    switch (event.type) {
      case "draftEdited":
        return {
          ...state,
          draft: mergeSignalDraft(state.draft, event.updates),
        };
      case "generationStarted":
        return { ...state, status: "generating", errorMessage: null };
      case "outputSelected":
        return { ...state, outputType: event.outputType };
      case "failed":
        return { ...state, status: "error", errorMessage: event.message };
    }
  };

  let chartDataCache:
    | {
        readonly rows: readonly FFTDataRow[];
        readonly frequencyLimit: number;
        readonly outputType: OutputType;
        readonly data: SignalData;
      }
    | undefined;

  const chartData = (state: SignalWorkbenchState): SignalData => {
    const frequencyLimit =
      state.committedSignal.freqrange === 0
        ? 10
        : state.committedSignal.freqrange;

    if (
      chartDataCache?.rows === state.rows &&
      chartDataCache.frequencyLimit === frequencyLimit &&
      chartDataCache.outputType === state.outputType
    ) {
      return chartDataCache.data;
    }

    const data = rowsToSignalData(
      state.rows,
      frequencyLimit,
      state.outputType,
    );
    chartDataCache = {
      rows: state.rows,
      frequencyLimit,
      outputType: state.outputType,
      data,
    };
    return data;
  };

  return {
    initialState: INITIAL_SIGNAL_WORKBENCH_STATE,
    bootstrap,
    persistDraft,
    generate,
    transition,
    chartData,
  } as const;
}

const browserAdapters: SignalWorkbenchAdapterShape = {
  readStorage: (key) =>
    Effect.try({
      try: () => {
        const rawValue = window.localStorage.getItem(key);
        return rawValue === null
          ? null
          : Schema.decodeUnknownSync(JsonValueFromString)(rawValue);
      },
      catch: (error) => new LocalStorageReadError({ key, error }),
    }),
  writeStorage: (key, value) =>
    Effect.try({
      try: () => {
        window.localStorage.setItem(
          key,
          Schema.encodeSync(JsonValueFromString)(value),
        );
      },
      catch: (error) => new LocalStorageWriteError({ key, error }),
    }),
  readRows: () =>
    Effect.tryPromise({
      try: () => getAllSignals(),
      catch: (error) =>
        new SignalDatabaseError({ operation: "readRows", error }),
    }),
  replaceRows: (rows) =>
    Effect.tryPromise({
      try: () => loadJSONToIndexedDB([...rows]),
      catch: (error) =>
        new SignalDatabaseError({ operation: "replaceRows", error }),
    }),
  generateRows: (params) =>
    computeFFTEffect(params).pipe(
      Effect.mapError((error) => new SignalGenerationError({ error })),
    ),
};

export const signalWorkbench = makeSignalWorkbench();

export function runSignalWorkbench<A, E>(
  effect: Effect.Effect<A, E, SignalWorkbenchAdapters>,
): Promise<A> {
  return Effect.runPromise(
    effect.pipe(
      Effect.provideService(SignalWorkbenchAdapters, browserAdapters),
    ),
  );
}
