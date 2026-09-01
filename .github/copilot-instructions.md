# GitHub Copilot instructions for Neurify

Neurify is an Arabic, RTL-first Expo/React Native application for neurosurgery department coordination. Treat it as a privacy-sensitive clinical operations project, not as a general consumer app.

## Architecture and implementation rules

- Use TypeScript and follow the existing Expo Router structure under `app/`.
- Preserve Arabic RTL behavior, Cairo typography, accessible text sizes, and one-handed portrait layouts.
- Reuse existing components, theme tokens, department models, permission helpers, and synchronization services before adding new abstractions.
- Use `ScreenContainer` for screens and `FlatList` for scalable lists.
- Do not add `className` to `Pressable`; use its `style` prop for interaction states.
- Add every new tab symbol to the existing icon mapping before referencing it.
- Avoid modifying files under `_core/` unless the change is explicitly infrastructure-related and no extension point exists.
- Keep client/server payload names aligned and validate external input with the project’s existing Zod patterns.

## Privacy and security rules

- Never generate or commit real patient names, medical-record numbers, diagnoses, clinical histories, credentials, tokens, or production database values.
- Use obviously synthetic test data and neutral patient codes.
- Keep lock-screen and push-notification text free of clinical or identifying details.
- Never hardcode service-role keys, JWT secrets, admin passwords, relay tokens, or API credentials. Read them from environment variables.
- Do not weaken role checks, team scoping, confirmation steps, or privacy tests to make a feature pass.
- Do not send repository content or clinical data to a new external service without explicit approval.

## Change quality

Keep changes small and explain non-obvious decisions in code comments. Update tests whenever behavior changes. Before considering work complete, run `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm build`, then resolve failures instead of bypassing them.
