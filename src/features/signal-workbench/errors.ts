import { Schema } from 'effect';

export class LocalStorageReadError extends Schema.TaggedErrorClass<LocalStorageReadError>()(
  'LocalStorageReadError',
  {
    key: Schema.String,
    error: Schema.Defect,
  }
) {}

export class LocalStorageWriteError extends Schema.TaggedErrorClass<LocalStorageWriteError>()(
  'LocalStorageWriteError',
  {
    key: Schema.String,
    error: Schema.Defect,
  }
) {}

export class InvalidStoredSignalParamsError extends Schema.TaggedErrorClass<InvalidStoredSignalParamsError>()(
  'InvalidStoredSignalParamsError',
  {
    key: Schema.String,
    error: Schema.Defect,
  }
) {}

export class InvalidSignalDraftError extends Schema.TaggedErrorClass<InvalidSignalDraftError>()(
  'InvalidSignalDraftError',
  {
    field: Schema.String,
    message: Schema.String,
  }
) {}

export class SignalGenerationError extends Schema.TaggedErrorClass<SignalGenerationError>()(
  'SignalGenerationError',
  {
    error: Schema.Defect,
  }
) {}

export class SignalDatabaseError extends Schema.TaggedErrorClass<SignalDatabaseError>()(
  'SignalDatabaseError',
  {
    operation: Schema.String,
    error: Schema.Defect,
  }
) {}

export type WorkbenchError =
  | LocalStorageReadError
  | LocalStorageWriteError
  | InvalidStoredSignalParamsError
  | InvalidSignalDraftError
  | SignalGenerationError
  | SignalDatabaseError;

export function describeWorkbenchError(error: WorkbenchError): string {
  switch (error._tag) {
    case 'InvalidSignalDraftError':
      return error.message;
    case 'SignalGenerationError':
      return 'Signal generation failed. Check the current parameters and try again.';
    case 'SignalDatabaseError':
      return 'The generated signal could not be stored or loaded.';
    case 'LocalStorageReadError':
    case 'LocalStorageWriteError':
    case 'InvalidStoredSignalParamsError':
      return 'Saved settings could not be restored cleanly. Defaults were used where needed.';
  }
}
