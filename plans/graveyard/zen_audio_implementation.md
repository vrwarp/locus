# Zen Audio Implementation

## Overview
Added an ambient audio feature to the existing Zen Mode during the data anomaly review flow.

## Implementation Details
1. **State & Config Management:**
   - Expanded `AppConfig` in `src/utils/storage.ts` to include a `zenAudioTheme` string field.
   - Updated `src/components/ConfigModal.tsx` to include a dropdown specifically nested under the "Zen Mode" toggle. Options include 'none', 'rainfall', and 'soft-synths'. This component saves the selected theme alongside the other config fields.

2. **Audio Execution:**
   - Validated existing audio functions `playAmbientAudio` and `stopAmbientAudio` in `src/utils/audio.ts`, which utilize the native Web Audio API (`AudioContext`).
   - The 'rainfall' theme uses a lowpass-filtered brown noise generator, and 'soft-synths' uses a slowly modulating sine wave chord (A Major).

3. **Component Integration:**
   - Modified `src/components/ReviewMode.tsx` to accept the new `zenAudioTheme` prop.
   - Integrated a dedicated `useEffect` hook to trigger `playAmbientAudio(zenAudioTheme)` when the ReviewMode modal is open, Zen Mode is active, the theme is not 'none', and global sounds are not muted.
   - Included a cleanup function within the `useEffect` that reliably calls `stopAmbientAudio()` when the modal closes or the component unmounts.
   - Updated `src/App.tsx` to pass the saved `config.zenAudioTheme` state down to the `ReviewMode` component.

## Testing Details
- Updated `src/components/ConfigModal.test.tsx` to verify that the ambient audio theme dropdown correctly renders when Zen Mode is enabled, captures user input correctly, and successfully stores the selected option in the mock config upon saving.
- Updated `src/components/ReviewMode.test.tsx` with targeted assertions verifying the interaction with the audio subsystem. Specifically checked that `playAmbientAudio` triggers properly with the provided theme, that `stopAmbientAudio` is fired upon unmounting, and that no audio is played if the selected theme is 'none'. Tests were successful with no regressions across the remaining 90 test files.
