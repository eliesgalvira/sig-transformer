import Dexie, { type Table } from "dexie";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { FFTDataRow } from "@/lib/types/signal";

class SignalDatabaseOperationError extends Schema.TaggedErrorClass<SignalDatabaseOperationError>()(
  "SignalDatabaseOperationError",
  {
    operation: Schema.String,
    error: Schema.Defect,
  },
) {}

export class SignalDatabase extends Dexie {
  signals!: Table<FFTDataRow, number>;

  constructor() {
    super("SignalDB");
    this.version(1).stores({
      signals: "Freq",
    });
  }
}

let db: SignalDatabase | null = null;

export function getDB(): SignalDatabase {
  if (db === null) {
    db = new SignalDatabase();
  }
  return db;
}

export const createDBEffect = Effect.sync(() => getDB());

export const createDB = (): Promise<SignalDatabase> =>
  Effect.runPromise(createDBEffect);

export const loadJSONToIndexedDBEffect = (jsonData: FFTDataRow[]) =>
  Effect.gen(function* () {
    const database = getDB();
    yield* Effect.log(
      "Data loaded from JSON file into IndexedDB:",
      jsonData.length,
      "rows",
    );
    yield* Effect.tryPromise({
      try: () => database.signals.clear(),
      catch: (error) =>
        new SignalDatabaseOperationError({ operation: "clearRows", error }),
    });
    yield* Effect.tryPromise({
      try: () => database.signals.bulkAdd(jsonData),
      catch: (error) =>
        new SignalDatabaseOperationError({ operation: "bulkAddRows", error }),
    });
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError("Error loading data into IndexedDB:", error),
    ),
  );

export const loadJSONToIndexedDB = (jsonData: FFTDataRow[]): Promise<void> =>
  Effect.runPromise(loadJSONToIndexedDBEffect(jsonData));

export const checkDBHasDataEffect = Effect.gen(function* () {
  const database = getDB();
  const count = yield* Effect.tryPromise({
    try: () => database.signals.count(),
    catch: (error) =>
      new SignalDatabaseOperationError({ operation: "countRows", error }),
  });
  return count > 0;
}).pipe(
  Effect.catch((error) =>
    Effect.gen(function* () {
      yield* Effect.logError("Error checking DB data:", error);
      return false;
    }),
  ),
);

export const checkDBHasData = (): Promise<boolean> =>
  Effect.runPromise(checkDBHasDataEffect);

export const getAllSignalsEffect = Effect.gen(function* () {
  const database = getDB();
  return yield* Effect.tryPromise({
    try: () => database.signals.toArray(),
    catch: (error) =>
      new SignalDatabaseOperationError({ operation: "readRows", error }),
  });
}).pipe(
  Effect.catch((error) =>
    Effect.gen(function* () {
      yield* Effect.logError("Error fetching signals:", error);
      return [];
    }),
  ),
);

export const getAllSignals = (): Promise<FFTDataRow[]> =>
  Effect.runPromise(getAllSignalsEffect);
