# Contributing

Thanks for helping improve Buddy AI Avatar.

## Development

```bash
npm install
npm run tauri dev
```

Before opening a pull request:

```bash
npm run build
```

If your change touches Rust, also run:

```bash
cd src-tauri
cargo check
```

## Pull Request Guidelines

- Keep changes focused.
- Do not commit secrets, local config files, build output, screenshots with private data, or generated caches.
- Explain user-facing behavior changes.
- Include screenshots or short videos for UI changes when useful.
- Mention privacy or security implications for screen capture, provider calls, local storage, or Tauri permissions.

## Good First Issues

- Improve docs and setup instructions.
- Add tests around provider adapters.
- Harden Tauri permissions.
- Improve privacy controls.
- Add cross-platform capture support.
- Polish responsive desktop UI states.
