# Security Policy

Buddy AI Avatar is an experimental desktop AI companion. It can capture screenshots and send them to configured AI providers, so privacy and key handling matter.

## Supported Versions

The project is pre-1.0. Security fixes target the latest `main` branch.

## Reporting a Vulnerability

Please do not open a public issue with exploitable details or secrets.

Report security concerns by opening a private GitHub security advisory for this repository, or contact the maintainer through the GitHub profile linked to the repository owner.

Useful reports include:

- leaked credentials or unsafe key handling
- screenshot privacy issues
- overly broad Tauri permissions
- unsafe local file access
- dependency vulnerabilities
- prompt-injection paths that could cause unintended actions

## User Safety

- Do not commit API keys or local config files.
- Do not use the app on sensitive screens unless you understand which provider receives screenshots.
- Rotate any key that may have been exposed.
- Review code changes carefully before running forks or pull requests locally.

## Current Known Limitations

- Production CSP hardening is still planned.
- Provider keys are stored in local app config today; OS keychain storage is a roadmap item.
- macOS capture is implemented first; other platforms need review before broad use.
