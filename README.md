# Buddy AI Avatar

An open-source desktop AI companion built with Tauri, React, TypeScript, and Rust. Buddy floats on your desktop, can analyze screenshots with vision-capable AI models, respond in chat, and draw lightweight overlay annotations when it spots something useful.

The project is early but usable as a reference for developers building desktop AI agents, screen-aware assistants, Tauri overlays, and local-first companion apps.

## Features

- Desktop companion avatar with always-on-top transparent window
- Chat panel with local message history
- Screenshot analysis through Claude, OpenAI, or Gemini-compatible provider settings
- Overlay annotations for pointing at UI issues or suggested actions
- Local config storage for provider keys and preferences
- Local SQLite-backed memory for messages and facts
- macOS screen capture support through the built-in `screencapture` tool
- React + CSS Modules frontend with a Tauri/Rust backend

## Why It Exists

Buddy explores a practical question: what would a helpful AI companion look like if it lived next to your work instead of inside a single chat tab?

It is meant for experimentation with:

- desktop AI copilots
- multimodal screen understanding
- local-first agent UX
- draggable always-on-top assistant windows
- privacy-aware screenshot workflows
- Tauri 2 app architecture

## Tech Stack

- Tauri 2
- React 18
- TypeScript
- Rust
- SQLite via `rusqlite`
- Vite
- CSS Modules

## Getting Started

Prerequisites:

- Node.js 20+
- Rust stable
- Tauri prerequisites for your OS
- macOS 13+ for the current screen-capture path

Install dependencies:

```bash
npm install
```

Run the web shell:

```bash
npm run dev
```

Run the desktop app:

```bash
npm run tauri dev
```

Build:

```bash
npm run build
npm run tauri build
```

## API Keys

Buddy does not ship with API keys.

Users add their own provider keys in the app settings. Keys are stored locally in the platform config directory under the app's config file, not in the repository.

Never commit `.env`, local config files, screenshots with sensitive data, or personal API keys.

## Privacy Notes

Buddy can capture your screen when screen analysis is enabled. Treat it like any other screen-sharing or screenshot tool:

- review provider settings before using it with sensitive work
- keep private mode on when you do not want proactive analysis
- avoid sending screenshots that contain secrets, credentials, customer data, or private documents
- rotate any API key that may have been exposed during testing

## Security Posture

The app uses local Rust commands for config, capture, and database work. The frontend no longer requests broad Tauri filesystem or shell permissions.

Current limitations:

- macOS screen capture is the primary implemented capture path
- CSP is still relaxed during early development
- the project is not yet security-audited for production use

See [SECURITY.md](SECURITY.md) for responsible disclosure and safety guidance.

## Roadmap Ideas

- Stricter production CSP
- Signed release builds
- Cross-platform capture support
- Safer provider-key storage using OS keychains
- More avatar packs and user-created avatars
- Plugin system for actions
- Optional local model support
- Better onboarding and privacy controls

## Contributing

Contributions are welcome. Good first areas:

- security hardening
- Tauri permission tightening
- cross-platform capture
- UI polish
- model provider adapters
- documentation
- tests

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT License. See [LICENSE](LICENSE).
