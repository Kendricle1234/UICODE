# CCEW Companion

A browser-local prototype for reviewing wearable safety flows without an ESP32, PCB, Bluetooth device, microphone, or messaging service. Every reading, contact delivery, reply, haptic response, and recording is simulated.

## Open or develop

Open `CCEW_Companion.html` in Chrome or Edge. It embeds all scripts, CSS, and SVG assets and needs no package installation.

For development, run `node serve.cjs` from `app-ui/`. The local server uses port 4173; `CCEW_UI_PORT` can override it. Edit `dist/` and refresh. The server binds to this computer only.

From the repository root, rebuild the standalone file and source ZIP after editing:

```sh
python tools/package_app_ui.py
```

The archive includes editable source, services, instructions, tests, and their latest successful browser results. A server process must be restarted in a new cloud task.

## Battery requirement

The battery-life design target is **more than 12 hours (>12 hours)**. The percentage is simulated charge, not a measured voltage or a prediction of operating hours. Actual runtime remains unmeasured until the battery, firmware, and hardware can be tested. USB-C is the charging interface.

## Readiness and device checks

Overview prioritizes a known active fall check-in, connection progress/disconnection, skin contact, low battery at 20% or below, component failures, and pending event synchronization before showing **Ready when you need it**. A battery at 21% passes the charge threshold. Charging does not bypass a low charge warning.

Connected, Connecting, Syncing, Disconnected, Low Battery, and Skin Contact Lost have distinct badges and descriptions. Phone readings are last known while disconnected or connecting. Demo controls explicitly expose the physical simulator state; the disconnected phone UI does not reveal newly generated wearable events or their live queue count.

The device check independently tests simulated Bluetooth, charge, skin contact, motion, audio, and haptic component availability. Disconnected sensor results are unknown. A healthy simulated motor does not prove that any individual vibration command completed.

## Alert lifecycle

Each event has a stable ID, origin, type, and separate timestamps for:

1. Detection on the wearable or creation by the phone.
2. Phone receipt of event metadata.
3. Simulated delivery to safety contacts.
4. Acknowledgement by a selected recipient.
5. Explicit wearable confirmation that haptic feedback completed.

Detection is not delivery, and delivery is not a human reply. The history shows exact timestamps with timezone, event IDs, metadata transfer, delivery, responder, audio progress, and feedback state. Filters combine event type and acknowledgement/delivery status.

A phone alert requires a connection and rechecks it when the confirmation button is pressed. An offline phone action never creates an event on the wearable. The **physical button** in Demo controls can create offline wearable events. Their metadata queues and transfers after reconnecting, with stable IDs preventing duplicate history entries.

Contact delivery is a separate phone-side simulation. It can succeed while BLE is disconnected after the phone has received the event. Demo controls can force delivery failure; the event dialog supports retry. No external contact messages are sent.

Haptic feedback has **not requested**, **pending**, **command sent**, **successful**, and **failed** states. A reply requests feedback, reconnecting sends the command, and only **Simulate wearable confirmation** completes it. A motor-failure response or five-second confirmation timeout fails the command. Retry preserves its command ID for future device-side deduplication. Disconnects and reloads return unconfirmed commands to pending; they never manufacture success.

## Audio and interruption behavior

Audio metadata represents 20 seconds before plus 20 seconds after an event. After the capture window finishes, the simulator transfers eight uniquely indexed chunks. Disconnecting pauses transfer. Reconnection or reload resumes missing chunks without resetting progress or duplicating received chunks. Once transferred, a sample remains playable and downloadable offline.

Playback and downloads contain generated quiet tones, not real recordings. An unavailable audio component prevents a simulated capture from claiming success. No microphone permission is requested.

Skin-contact loss must remain stable for **1.5 seconds** before generating one removal alert. A **400 ms brief loss** in Demo controls is filtered out. The dashboard shows a checking state during debounce. Each sustained removal episode creates one event until contact has been stably restored.

A possible fall starts a proposed **10-second** grace period. Repeated detections increment a counter without extending the original deadline. The phone can cancel while connected; Demo controls also provide a physical wearable cancellation that works offline. A timed-out session creates one fall event with a deterministic ID. **Save & reload** preserves the deadline, and an expired restored session generates its event once. Cancelled sessions do not generate emergency events.

These timing values are simulator choices to review with the firmware team. A closed browser runs no background hardware logic; on reopening, the simulator reconciles persisted deadlines. It does not validate real firmware timing or mobile background execution.

## Contacts and saved data

The first contact is primary. Use **Make primary** and the backup up/down buttons to choose ordering. Deletion requires a confirmation dialog and checkbox. Each delivery stores its recipient snapshot, so later edits or removal do not rewrite responder history. A reply can be simulated from a selected delivered recipient.

Profile, contact order, events, chunk progress, fall deadlines, and pending feedback are saved to browser-local storage. The v1 data key is retained for automatic migration. Earlier acknowledgements are preserved, but old automatically successful haptics become pending until explicitly confirmed. Resetting the demo requires confirmation. If browser storage is unavailable, the UI explains that changes last only for the session.

## Service structure

Classic browser scripts are loaded in order so the standalone version also works without module-server or bundler requirements. Classes live under the `CCEW` namespace; the app entry point composes them and renders the UI.

| File | Responsibility |
| --- | --- |
| `services/Store.js` | Versioned state, migration, persistence, sample data, stable identifiers |
| `services/DeviceService.js` | Telemetry access, last-known readings, readiness, individual component results |
| `services/BleService.js` | Mock connection lifecycle, command sending, event subscription; configurable protocol adapter boundary |
| `services/AlertService.js` | Event IDs, deduplication, metadata queue, contact delivery, selected replies |
| `services/HapticService.js` | Pending/sent/completed/failed commands, confirmations, timeout and retry |
| `services/AudioService.js` | Capture metadata, resumable indexed chunks, synthetic playback and WAV generation |
| `services/DemoWearable.js` | Physical button, sensors, debounce, battery, fall sessions, simulated haptic results |
| `app.js` | Service composition, navigation, presentation, forms and demo controls |

Future BLE work can replace the transport adapter and feed the services with firmware telemetry and events. UUIDs and packet layouts remain unspecified until the team confirms them. Real contact delivery requires a backend/mobile contract; the current delivery adapter remains a simulation. Real recording, hardware runtime, background BLE, and actual motor movement are unvalidated.

## Validation

From `app-ui/`, run the deterministic service tests:

```sh
node --test tests/services.test.cjs
```

Start `node serve.cjs` in a separate terminal, then run:

```sh
node tests/readiness.test.cjs
```

Browser tests use Playwright and Chromium. `CCEW_BROWSER_PATH` overrides `/usr/bin/chromium`; `CCEW_UI_URL` overrides the development server URL. These tools are for testing only; the app has no runtime dependencies.

The eight acceptance scenarios are covered by service tests and exercised in the browser suite: disconnect during event transfer, disconnect during audio transfer, offline contact acknowledgement, contact debounce, fall cancellation, multiple queued events, restored pending state, and low-battery readiness. Additional checks cover failed delivery, haptic timeout/retry, repeated/interrupted falls, migration, independent component failures, selected responders, contact ordering/deletion, exact timestamps and filters, greeting time, and responsive layouts.

Browser validation checks both the editable app and exact standalone document. The cloud browser blocks `file://` navigation, so the standalone is served over temporary local HTTP for testing; direct opening from disk remains unverified here. See `tests/readiness-results.json` for the latest completed run. Actual hardware and delivery-service behavior are not tested.
