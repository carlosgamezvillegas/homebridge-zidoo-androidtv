# Changelog
## [5.0.1] - 2026-05-09
- Bug Fixes
## [5.0.0] - 2026-05-02
- Homebridge 2.0 support
- Refactored Zidoo TV input source setup to use a dedicated `buildInputSources()` helper
- Added declarative input source definitions and routed creation through `this.getOrCreateInputSource(definition)`.
- Added `createInputSourceService(definition)` to centralize `Identifier`, `ConfiguredName`, `IsConfigured`, `InputSourceType`, and optional visibility setup.
- Preserved backward compatibility for existing cached services by supporting legacy service names (`Elapsed Time`, `Video Format`, and `Audio Format`) when resolving existing input source services.
- Added method-level comments throughout `index.js` to document lifecycle flow, command dispatch/decoding, state updates, and utility helpers.
- Refactored repetitive optional switch setup into reusable builders: `createStatefulSwitch(...)`, `createStatelessSwitch(...)`, and `buildStatelessSwitches()`.
- Added declarative `STATELESS_SWITCH_CONFIGS` plus `cleanupDisabledStatelessSwitches()` to centralize optional-button creation/removal logic.
- Refactored duplicated volume/movie dimmer-vs-fan branches into shared helpers: `buildDualModeRangeService(...)`, `buildVolumeControlService()`, and `buildMovieProgressService()`.
- Replaced large `commandName(...)` and `pressedButton(...)` switch chains with declarative lookup tables (`COMMAND_NAME_MATCHES`, `BUTTON_KEY_SUFFIXES`) while preserving fallback behavior.
- Fixed `logError(...)` conditional bug and upgraded logging methods to support multiple arguments with safer value formatting.
- Improved HTTP command reliability with URL validation, request timeout handling, status-code logging, and JSON parse error reporting.
- Added managed timer helpers and shutdown cleanup hooks to clear intervals/timeouts and close UDP sockets cleanly.
- Replaced deprecated `new Buffer.from(...)` usage with `Buffer.from(...)`.
- Added configurable history log directory (`logDirectory`) and set the default to `/var/lib/homebridge/DeviceStateLogs/`.
- Fixed MAC discovery wake-up state update bug (`this.macReceived = true` assignment).
- Added unknown-command guard in `pressedButton(...)` to avoid silently issuing malformed command URLs.
- Fixed `config.schema.json` layout section headers that were rendering as `undefined` in the Homebridge web UI by replacing `{{ value.title }}` with explicit fieldset titles.
- Fixed Power switch service lookup to use an explicit name/subtype instead of generic `getService(Switch)`, preventing accidental binding to unrelated switch services.
- Hardened service cleanup with `safeRemoveService(...)` and routed all optional-service removals through it to avoid undefined-service removal crashes.
- Corrected pause response token matching (`MediaPause`) and fixed playback-state stopped checks to compare array values explicitly.
- Hardened UDP discovery payload parsing and guarded optional `rawData['3D']` fields to prevent crashes on incomplete device responses.
- Updated HTTP retry accounting to increment `httpNotResponding` only for actual request attempts.
- Fixed movie timer state synchronization logic to compare against an explicit numeric target value (`0/1`) instead of an ambiguous expression.
- Updated movie timer service resolution to use explicit service name/subtype, preventing accidental binding to other Valve services.
- Refactored `httpEventDecoder(...)` into focused handlers (`routeHttpEvent`, `handleVideoStatusPayload`, `handleMusicStatusPayload`, and helpers) to improve maintainability and readability.
- Hardened playback/music payload parsing with defensive guards for missing nested properties (`video`, `audio`, `subtitle`, `playingMusic`).
- Added robust numeric parsing helpers (`toFiniteNumber`) and runtime formatting helpers (`normalizeRuntimeFromMs`) to avoid NaN propagation from malformed payloads.
- Improved volume parsing compatibility by supporting both `currentVolume` and `currenttVolume` fields where firmware variants differ.
- Removed unused helper methods (`ensureName`, `timeToSeconds`, `justNumber`) to reduce dead code in `index.js`.
- Reordered methods alphabetically (keeping constructors first) in both `zidooPlatform` and `zidooAccessory` classes for easier navigation.
- Final pass typo/fault cleanup in `index.js`: corrected log/comment typos, converted safe loose comparisons to strict comparisons, and fixed `helloMessage` error checks.
- Switched `fs` import from `var` to `const` and removed the legacy `FORWAD` typo alias from button-key mappings.
- Split the large `zidooAccessory` constructor into setup phases (`setupAccessoryInformationService`, `setupTelevisionServices`, `setupSpeakerService`, `setupOptionalServices`, `cleanupDisabledServices`, `startConnectivityServices`, `startSynchronizationLoops`).
- Added polling in-flight protection with `queuePollingRequests()` and `pollInFlight` state to avoid overlapping request batches.
- Added HTTP keep-alive agent reuse (`http.Agent` with `keepAlive`) and integrated it into request dispatch.
- Updated `query(...)` to fail closed on unknown query names by logging an error and returning `null`.
- Refactored `sending(...)` to return a completion `Promise` and resolve success/failure on timeout, parse error, or request error.
- Reworked history logging to buffered stream writes (`openHistoryWriteStream`, `writeHistoryLine`) without size-based rotation limits.
- Added clean shutdown of history stream and keep-alive HTTP agent in `registerShutdownHandler()`.
- Added unit tests in `test/index.logic.test.js` and wired `npm test` to validate key command mapping and decoder/query behavior.
- Extended `config.schema.json` with `logDirectory` for history log path configuration and removed rotation-size settings.
- Added availability-first polling via `probeDeviceAvailability()` so status updates wait for a successful `getModel` response before querying other endpoints.
- Suppressed expected offline transport errors (including `socket hang up`) for `getModel` requests to avoid noisy logs while the device is off.
- Suppressed expected offline transport errors for power-off commands (`Key.PowerOn.Poweroff` and `Key.PowerOn.Standby`) so unreachable-offline shutdown attempts do not spam logs.
- Fixed history log path assignment to always use `/var/lib/homebridge/DeviceStateLogs/` (ignoring configurable overrides).

## [4.0.1] - 2024-10-29
- Bug fixes
## [4.0.0] - 2024-09-23
- Bug fixes
- Added support for Zidoo 8K models
- Added support to add multiple devices (This change is going to break any previous setup)
## [3.1.0] - 2024-05-23
- Bug fixes
- Added the option to change the Info button in the Remote to the Menu button
- Playback buttons are optional now
## [3.0.1] - 2023-12-17
- Bug fixes
## [3.0.0] - 2023-11-13
- Bug fixes
- Added the ability to change dimmer accessories to Fan accessories
- Added a Timer for playing media
- Added volume control
## [2.0.2] - 2023-02-23
- Bug fixes
## [2.0.1] - 2022-05-10
- Homebridge Verified Badge added
## [2.0.0] - 2022-05-07
- The IP and MAC address can be found automatically now using the UDP broadcast of the device
## [1.0.0] - 2022-04-09
- General performance and stability improvements
- Bug fixes
## [0.3.0] - 2022-04-09
- Bug fixes
- Added Reboot button
## [0.2.1] - 2022-03-27
- Bug fixes
- Performance improvements
## [0.1.1] - 2022-03-18
- First Plug-in release
