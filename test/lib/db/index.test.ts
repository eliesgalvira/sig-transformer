import { afterEach, describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import "fake-indexeddb/auto";
import Dexie, { type Table } from "dexie";
import type { FFTDataRow } from "@/lib/types/signal";

function createRows(count: number): FFTDataRow[] {
  return Array.from({ length: count }, (_, index) => {
    const frequency = (index - count / 2) / (count * 0.01);
    const rounded = Math.round(frequency * 100) / 100;

    return {
      frequency,
      Freq: Object.is(rounded, -0) ? 0 : rounded,
      "re(FFT)": 0,
      "im(FFT)": 0,
      "abs(FFT)": 0,
      input: index,
      "re(signal)": 1,
    };
  });
}

class BrokenSignalDatabase extends Dexie {
  signals!: Table<FFTDataRow, number>;

  constructor() {
    super("SignalDB");
    this.version(1).stores({
      signals: "++id, frequency, Freq",
    });
  }
}

describe("SignalDatabase", () => {
  afterEach(() =>
    Effect.runPromise(
      Effect.all([
        Effect.promise(() => Dexie.delete("SignalDB")),
        Effect.promise(() => Dexie.delete("SignalWorkbenchDB")),
      ]),
    ),
  );

  it.effect(
    "stores large datasets without migrating the legacy SignalDB primary key",
    () =>
      Effect.gen(function* () {
        const brokenDb = new BrokenSignalDatabase();
        yield* Effect.promise(() => brokenDb.signals.bulkAdd(createRows(32)));
        brokenDb.close();

        const { createDB, getAllSignals, loadJSONToIndexedDB } =
          yield* Effect.promise(() => import("@/lib/db"));
        const rows = createRows(16_384);

        yield* Effect.promise(() => loadJSONToIndexedDB(rows));

        const storedRows = yield* Effect.promise(() => getAllSignals());
        expect(storedRows).toHaveLength(rows.length);

        const appDb = yield* Effect.promise(() => createDB());
        appDb.close();
      }),
  );
});
