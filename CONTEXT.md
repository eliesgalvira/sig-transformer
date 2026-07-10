# Signal Workbench

This context covers the browser workbench for configuring sampled waveforms and inspecting their frequency-domain transform.

## Language

**Signal Workbench**:
The interactive workspace where a user edits a signal draft, generates a committed signal, and inspects the resulting transform.
_Avoid_: app state, dashboard, tool

**Signal Draft**:
The editable waveform parameters before the user generates a signal.
_Avoid_: form state, temporary params

**Committed Signal**:
The generated signal produced from a submitted Signal Draft and used for transform inspection.
_Avoid_: submitted form, current params
