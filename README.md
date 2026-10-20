# UICODE
UICODE for capstone

## CCEW Companion

- [Download the standalone HTML](app-ui/CCEW_Companion.html?raw=true), then open it in Chrome or Edge.
- [Download the editable source ZIP](CCEW_Companion_UI.zip?raw=true).
- [Development instructions and readiness checks](app-ui/README.md).

The simulator separates event detection, phone receipt, contact delivery, acknowledgement, and confirmed haptic completion. It supports offline queues, resumable audio, contact debounce, fall cancellation/recovery, independent component faults, contact ordering, and detailed history.

Battery-life design target: **more than 12 hours**. Actual runtime is not yet measured. All device values remain simulated.

See [validation results](app-ui/tests/readiness-results.json) and [service tests](app-ui/tests/services.test.cjs) for the hardware-free checks. To get the full project, select **Code → Download ZIP**, extract it, and open `app-ui/CCEW_Companion.html` in Chrome or Edge.
