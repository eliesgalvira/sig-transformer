import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { checkDBHasData, getAllSignals, loadJSONToIndexedDB } from "@/lib/db";
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
  DEFAULT_SIGNAL_DRAFT,
  type SignalBootstrap,
  type SignalDraft,
  decodeDraftToSignalParams,
  decodeStoredSignalDraft,
  decodeStoredSignalParams,
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

function readStorageItem(key: string) {
  return Effect.try({
    try: () => {
      const rawValue = window.localStorage.getItem(key);
      return rawValue === null
        ? null
        : Schema.decodeUnknownSync(JsonValueFromString)(rawValue);
    },
    catch: (error) => new LocalStorageReadError({ key, error }),
  });
}

function writeStorageItem(key: string, value: unknown) {
  return Effect.try({
    try: () => {
      window.localStorage.setItem(
        key,
        Schema.encodeSync(JsonValueFromString)(value),
      );
    },
    catch: (error) => new LocalStorageWriteError({ key, error }),
  });
}

function replaceSignalRows(rows: FFTDataRow[]) {
  return Effect.tryPromise({
    try: () => loadJSONToIndexedDB(rows),
    catch: (error) =>
      new SignalDatabaseError({ operation: "replaceRows", error }),
  });
}

function readSignalRows() {
  return Effect.tryPromise({
    try: () => getAllSignals(),
    catch: (error) => new SignalDatabaseError({ operation: "readRows", error }),
  });
}

function hasSignalRows() {
  return Effect.tryPromise({
    try: () => checkDBHasData(),
    catch: (error) => new SignalDatabaseError({ operation: "hasRows", error }),
  });
}

function generateSignalRows(params: SignalParams) {
  return computeFFTEffect(params).pipe(
    Effect.mapError((error) => new SignalGenerationError({ error })),
  );
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

function ignorePersistenceFailure(
  effect: Effect.Effect<void, LocalStorageReadError | LocalStorageWriteError>,
) {
  return effect.pipe(
    Effect.catchTag("LocalStorageReadError", (error) =>
      logNonBlockingError(error),
    ),
    Effect.catchTag("LocalStorageWriteError", (error) =>
      logNonBlockingError(error),
    ),
  );
}

function readStoredParamsOrElse(key: string, fallback: SignalParams) {
  return Effect.gen(function* () {
    const storedValue = yield* readStorageItem(key).pipe(
      Effect.catchTag("LocalStorageReadError", (error) =>
        Effect.gen(function* () {
          yield* logNonBlockingError(error);
          return null;
        }),
      ),
    );

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
}

function readStoredDraftOrElse(key: string, fallback: SignalDraft) {
  return Effect.gen(function* () {
    const storedValue = yield* readStorageItem(key).pipe(
      Effect.catchTag("LocalStorageReadError", (error) =>
        Effect.gen(function* () {
          yield* logNonBlockingError(error);
          return null;
        }),
      ),
    );

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
}

export const bootstrapSignalWorkbench = Effect.fn("signalWorkbench.bootstrap")(
  function* () {
    const defaultParams = decodeDraftToSignalParams(DEFAULT_SIGNAL_DRAFT);
    const legacyParams = yield* readStoredParamsOrElse(
      LEGACY_STORAGE_KEY,
      defaultParams,
    );
    const committedParams = yield* readStoredParamsOrElse(
      COMMITTED_STORAGE_KEY,
      legacyParams,
    );
    const draft = yield* readStoredDraftOrElse(
      DRAFT_STORAGE_KEY,
      toSignalDraft(committedParams),
    );
    const hasRows = yield* hasSignalRows();

    yield* ignorePersistenceFailure(
      writeStorageItem(COMMITTED_STORAGE_KEY, committedParams),
    );
    yield* ignorePersistenceFailure(writeStorageItem(DRAFT_STORAGE_KEY, draft));

    if (!hasRows) {
      const rows = yield* generateSignalRows(committedParams);
      yield* replaceSignalRows(rows);
    }

    const bootstrap: SignalBootstrap = {
      draft,
      signalParams: committedParams,
      generatedOnBoot: !hasRows,
    };

    return bootstrap;
  },
);

export const persistSignalDraft = Effect.fn("signalWorkbench.persistDraft")(
  function* (draft: SignalDraft) {
    yield* ignorePersistenceFailure(writeStorageItem(DRAFT_STORAGE_KEY, draft));
  },
);

export const submitSignalDraft = Effect.fn("signalWorkbench.submitDraft")(
  function* (draft: SignalDraft) {
    const params = yield* decodeDraftEffect(draft);
    const rows = yield* generateSignalRows(params);

    yield* replaceSignalRows(rows);
    yield* ignorePersistenceFailure(writeStorageItem(DRAFT_STORAGE_KEY, draft));
    yield* ignorePersistenceFailure(
      writeStorageItem(COMMITTED_STORAGE_KEY, params),
    );

    return params;
  },
);

export const loadSignalChartData = Effect.fn("signalWorkbench.loadChartData")(
  function* (params: SignalParams, outputType: OutputType) {
    const rows = yield* readSignalRows();
    const data: SignalData = rowsToSignalData(
      rows,
      params.freqrange === 0 ? 10 : params.freqrange,
      outputType,
    );
    return data;
  },
);

export function runSignalWorkbench<A, E>(
  effect: Effect.Effect<A, E>,
): Promise<A> {
  return Effect.runPromise(effect);
}
