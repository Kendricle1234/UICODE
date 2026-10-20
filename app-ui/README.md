# CCEW Companion UI prototype

A mobile-first, wearer-facing UI for the CCEW capstone. It is an interactive browser prototype, built with HTML, CSS, and JavaScript. No account, dependency installation, build step, or internet access is required to use the packaged single-file version.

## Open the app

**Simplest:** open `CCEW_Companion.html` in Chrome or Edge. That file embeds the styles, application logic, and illustrations. It can be shared on its own. The app uses sample profile and contact information; edits are kept in that browser's local storage when available.

**For development:** run `node serve.cjs` from this directory, then open `http://127.0.0.1:4173`. Edit files under `dist/` and refresh the browser. The server binds to this computer only. Use the `CCEW_UI_PORT` environment variable if port 4173 is already in use. Stop the server with Ctrl+C.

On this computer, the bundled Node command is:

```powershell
& 'C:\Users\Vinh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' serve.cjs
```

## Screens and interactions

| Screen | What works |
| --- | --- |
| Overview | Connection status, battery, skin contact, fall detection, audio context, recent activity, safety contacts, and alert creation |
| My device | Bluetooth details/reconnect, USB-C charging status, contact state, fall/audio state, device check, and visual haptic preview |
| Alerts | Filter events, open an event timeline, distinguish phone receipt from acknowledgement, preview/download synthetic audio |
| Contacts | Add, edit, remove, and persist safety contacts; primary/backup ordering follows the list |
| Settings | Edit the demo profile, save notice/display preferences, choose a proposed acknowledgement haptic pattern |

Use **Demo controls** in the desktop sidebar or the sliders icon in the mobile header. The `D` key opens these controls when focus is outside a text field. You can disconnect Bluetooth, remove skin contact, lower the battery, connect a USB-C charger, press the simulated alarm button, trigger a possible fall, and acknowledge an alert.

Useful review sequences:

1. Send an alert, open its timeline, and select **Simulate acknowledgement**. Phone receipt and a contact's reply are separate states. The visual haptic preview does not vibrate any hardware.
2. Disconnect Bluetooth, press the alarm button using Demo controls, then reconnect. New events stay in the simulated wearable's queue and do not appear on the phone until it reconnects. The demo controls expose the queue for testing; the normal phone UI does not pretend to know a disconnected device's live queue count.
3. Trigger a possible fall. Select **I'm okay** within ten seconds to cancel, or let the countdown finish to create an alert. This grace period is a proposed UI choice, not a finalized team requirement.
4. Turn skin contact off. A distinct removal alert is created. The UI uses generic skin-contact wording until the sensor approach is confirmed.
5. Open an event created just now. Its 20-second post-event window must finish before the synthetic 40-second sample becomes available. If Bluetooth disconnects before that upload, the audio stays queued until reconnection. A previously transferred sample remains available offline.
6. Acknowledge a visible event while Bluetooth is disconnected. The phone can show the simulated reply, but wearable feedback remains pending until reconnection.

All messages, device readings, audio, and acknowledgements are simulated. The application makes **no external requests**, uses no real microphone or Bluetooth device, and sends no texts, emails, or emergency notifications. The audio sample contains generated quiet tones and is labeled synthetic. Browser-local storage is for review convenience, not a production data store or authenticated account.

## How the supplied documents shaped the UI

The latest `List of finalized features.docx` and `BOM.xlsx` are the current design references. Their contents were treated as source information, not instructions to buy hardware, message others, or modify the supplied documents.

| Finalized feature | UI treatment |
| --- | --- |
| Alarm button | Explicit demo alert action and event timeline |
| Fall detection | Active status, simulated fall check-in, and fall event type |
| Removal alert | Skin-contact state and removal event type |
| Blue/red connection LEDs | Device connection state is represented in the app; physical LEDs require firmware |
| Haptic acknowledgement | Reply state, visual pattern preview, and pending feedback during disconnect |
| Watch-sized wrist device | Wrist concept illustration and mobile-first layouts |
| No belt clip | No belt-clip UI |
| 12-hour battery life | Battery percentage and a clearly labeled design target; no invented runtime estimate |
| USB-C, no wireless charging | USB-C status only; no Qi controls |
| Queue events outside BLE range | Separate simulated device outbox and reconnect transfer |
| Continuous audio with 20s pre/post | Buffer status, post-event capture countdown, and event audio playback/download |

The feature list's “skin resistance” wording and the BOM's MPR121 capacitive touch breakout describe different sensing approaches. The user chose generic **skin contact** labels while the team confirms hardware. [Adafruit describes the selected MPR121 board as capacitive touch](https://www.adafruit.com/product/4830); this prototype does not show resistance in ohms or claim that the listed board measures skin resistance.

The updated BOM names an ESP32-S3-WROOM-1-N16R8, BNO086, ICS-43434, DRV2605L haptic driver, a 7 mm coin motor, and USB-C. These are background for future integration; the UI does not implement their drivers. The battery capacity/part-number discrepancy noted earlier still needs team confirmation before promising a 12-hour runtime.

## Decisions and assumptions

- User selected a wearer-facing, browser-based mobile prototype.
- User selected generic skin-contact status until hardware is confirmed.
- “20s pre/post” is interpreted as **20 seconds before plus 20 seconds after**, totaling 40 seconds. Confirm this with the team.
- The fall cancellation grace period is ten seconds for review; firmware policy and sponsor approval still need to define it.
- Editable safety contacts, responder profile, and contact acknowledgement are proposed companion-app flows based on the original responder alert concept. The new feature list mainly specifies the wearable.
- Sample names, phone numbers, device identity, battery level, and event history are demonstration data.
- The watch illustration is a UI concept, not a dimensioned replacement for the printable enclosure.

## Source files

`dist/index.html` contains the app shell. `dist/styles.css` contains responsive layouts and styles. `dist/app.js` contains the state model, screen rendering, local persistence, simulated event delivery, and synthetic audio. `dist/assets/` contains original SVG branding and the wrist-device concept.

`CCEW_Companion.html` is generated from those files by `tools/package_app_ui.py` in the project root. Rebuild that file after editing the source. The ZIP includes editable source, the standalone app, this guide, and preview images. QA screenshots and generated test audio stay under `tests/`.

## Next integration work

Replace the simulated connection/telemetry and event creation with the team's BLE transport after the service/characteristic UUIDs, packet format, acknowledgements, and audio chunking are defined. Keep sensor telemetry, event receipt, audio transfer, contact notification, and human acknowledgement as distinct states. Preserve IDs across retries so reconnects do not duplicate alerts. Real safety-contact delivery needs a backend and the existing mobile app's interface contract. This prototype does not choose or implement that service.

For real device use and background BLE/audio behavior on a phone, assess a native mobile implementation after the UI and protocol are reviewed. A browser design prototype alone does not validate those OS-level requirements.

## Verification

Fix #1 adds `deviceReadiness()` to choose the Overview heading and badge in this order:

1. Active fall check-in: **Are you okay?**
2. Bluetooth disconnected: **Let’s get you reconnected.** Sensor readings are last known.
3. Skin contact lost: **Check your wearable.**
4. Battery at or below 20%: **Time to recharge.** Charging does not bypass this threshold.
5. Connected, on wrist, battery above 20%: **Ready when you need it.**

Start the development server with `node serve.cjs`, then run:

```sh
node tests/readiness.test.cjs
```

The test needs Playwright and Chromium. `CCEW_BROWSER_PATH` overrides the default `/usr/bin/chromium`; `CCEW_UI_URL` overrides the development server URL. The application itself has no package dependencies.

The readiness suite checks 96 condition combinations for each of the development and standalone versions, including the 20%/21% boundary, overlapping warnings, charging, fall cancellation and timeout, demo reset, all five screens, and layouts at 1440, 390, and 320 pixels. Current results are written to `tests/readiness-results.json` only after both targets pass. This suite does not validate the unrelated audio/contact-editing flows described above.

The cloud browser blocks `file://` navigation, so the exact standalone document is tested through a temporary HTTP server. Direct opening from disk remains unverified in this environment. The standalone file embeds its JavaScript, CSS, and SVG assets.

From the repository root, rebuild the standalone and ZIP after source edits:

```sh
python tools/package_app_ui.py
```
