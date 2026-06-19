# Buddy Parity Checklist

Source of truth: the user-provided Buddy final spec plus donor patterns from OpenDesign, Clyde, NekoAI, screen-voice-agent, CodeWalkers, Natively, and Peekaboo.

## Current Decisions

- Buddy is a static desktop companion, not a roaming pet.
- OpenDesign pet contributes the visible speech bubble, calm ambient pet presence, tap-vs-drag separation, and persisted position model.
- OpenDesign `PetOverlay.tsx` was used as the behavior reference, but Tauri/macOS dragging now uses an explicit Rust `start_main_window_drag` command from the avatar/handle only; global background dragging is disabled so buttons and chat controls do not turn into drag targets.
- Clyde contributes edge/peek behavior, hit-zone thinking, floating cards near the pet, and future snap-to-edge work.
- NekoAI contributes provider/config/pet-asset structure and the idea of local key/provider storage.
- screen-voice-agent contributes the future direction for stronger macOS screen/audio capture, plugin hooks, and integrations.
- Natively contributes the click-through annotation overlay pattern.
- Final drag decision: Buddy uses explicit native drag from the avatar body and dock handle. The failed JS manual-position hook was removed; `NSWindow.movableByWindowBackground` was also removed because it made unrelated clicks behave like drag.

## Implemented

- Tauri v2 + React + Rust shell.
- Transparent always-on-top Buddy window.
- Static avatar with sprite-sheet animation fallback.
- Visible speech bubble near the avatar.
- Clickable chat entry via bubble, dock button, and hover peek tab.
- Multi-provider key storage for 10 providers.
- Active API provider is separated from screen-vision provider.
- Lower provider rows are selectable in Settings via native radio-card labels.
- Gemini/Claude/OpenAI vision routing with fallback.
- SQLite-backed messages and facts.
- Screenshot capture command.
- Screenshot capture hides Buddy and the annotation overlay before `screencapture`, then restores their previous visibility so screen analysis does not describe Buddy's own UI.
- Claude/Gemini/OpenAI strict JSON screen analysis path.
- Click-through annotation overlay window.
- Floating recommendation cards.
- Voice dictation and speech toggles with current browser/webview fallback behavior.
- Avatar body and dock handle are draggable via the explicit `start_main_window_drag` Tauri command.
- No React `preventDefault` / `stopPropagation` drag handler is attached to normal chat/settings/provider controls.
- macOS main window sets `ignoreCursorEvents=false`, `focusable=true`, and `shadow=false`; global `movableByWindowBackground` is deliberately not used.
- Window position is persisted and restored.
- Speech preview is temporary: old saved replies do not reappear at launch, and fresh replies auto-hide after 12 seconds unless chat is opened.
- Speech preview does not render while the chat panel is open, so old assistant bubbles do not overlap the chat input.
- Provider picker cards are real buttons, not hidden radio overlays, so lower rows such as DeepSeek, Perplexity, and Together are directly selectable.
- Active provider selection is separated from screen-vision routing; non-vision providers can stay active while screen analysis falls back to Gemini, Claude, or OpenAI.
- Gemini vision model ids use official API names: primary `gemini-3-flash-preview`, fallback `gemini-2.5-flash`.

## Verified Evidence

- Live macOS drag test moved the actual `buddy-avatar` window from `1248,496` to `1148,436` using the visible dock drag handle, and it stayed there after waiting.
- Provider smoke clicked real card labels and confirmed `deepseek`, `perplexity`, and `together` each became selected and checked.
- Provider Playwright smoke on `localhost:1420` confirmed 10 provider buttons and direct selection: `deepseek`, `perplexity`, and `together` each update the select value and `aria-pressed=true`.
- Idle-still smoke confirmed the avatar sprite frame stayed unchanged after hover + 1.4s (`background-position: 0% 0%` before/after); hover is not a behavior trigger, and idle CSS no longer animates the avatar or its shadow.
- Opening chat preserves the avatar's bottom anchor: avatar mode `Y=496,H=392` and chat mode `Y=250,H=560` both keep the same bottom edge.
- `npm run build`, `cargo check`, and `git diff --check` pass after the explicit native-drag cleanup.
- `capture_screen` has a restore guard, unique temp file names, and non-blocking Tokio process execution to avoid hidden-window and concurrent-capture races.
- Old JS drag-polling symbols (`set_main_window_position`, `get_cursor_position`, `cursorPoll`, `dragStart`) are absent from `src` / `src-tauri`.
- Current live Tauri window is present in CoreGraphics at `1248,95` with size `480,392`.
- CoreGraphics + `cliclick` verification can reach Buddy controls when targeting the visible dock drag handle; previous failures were caused by aiming below the handle.

## Still Missing Or Partial

- Real Rive state-machine avatars for Einstein, Tesla, Mendeleev, and Musk.
- True ScreenCaptureKit capture pipeline from screen-voice-agent; current capture uses macOS `screencapture`.
- Clyde-style separate hit window with edge snap, mini/peek suppression, and position lock.
- Automatic hover-peek collapse/expand behavior for the full chat panel.
- Peekaboo action execution confirmation flow for `action_suggestion`.
- Browser DOM/CDP context path in addition to screenshots.
- Figma, n8n, Supabase, and GitHub integration clients in Buddy settings.
- Wake-word / continuous voice conversation mode.
- Permission health screen for Screen Recording and Accessibility.

## Next Best Slices

1. Add permission health/status panel so Buddy explains why capture/click/voice are unavailable.
2. Port Clyde-style edge snap/mini peek for the avatar window.
3. Replace placeholder/single dentist sprite with proper four-avatar assets or Rive files.
4. Add Peekaboo action confirmation and execution.
5. Replace `screencapture` with ScreenCaptureKit and richer browser/DOM context.
