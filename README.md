# Neurify

**Neurify** is an Arabic, RTL-first mobile workspace for coordinating the Neurosurgery Department at King Saud Medical City. It brings together daily operational summaries, medical report requests, on-call schedules, operating-room planning, treatment teams, discussions, and administrative workflows in one Expo application.

> This repository is intended for controlled development and evaluation. Do not enter, commit, log, or use real patient-identifiable information until institutional privacy, access-control, hosting, and security requirements have been formally approved.

## Technology

| Area | Implementation |
|---|---|
| Mobile application | React Native 0.81, Expo SDK 54, Expo Router 6, TypeScript |
| Interface | NativeWind, Cairo fonts, Arabic RTL layouts, light clinical theme |
| Local state | React state/context and local persistence |
| Server | Node.js, Express, tRPC, Drizzle ORM |
| Central services | Supabase registration/synchronization and push-notification support |
| Quality | TypeScript checks, ESLint, Vitest, and a GitHub Actions workflow |

## Main project areas

| Path | Purpose |
|---|---|
| `app/` | Expo Router screens and navigation |
| `components/` | Shared mobile interface components |
| `lib/` | Department models, state, permissions, notifications, and synchronization logic |
| `server/` | Node/tRPC API and server-side integrations |
| `supabase/` | Central registration function and related database assets |
| `tests/` | Unit, integration, privacy, and configuration tests |
| `assets/` | App icons, fonts, and bundled visual assets |

## Local setup

Install Node.js 22 and enable Corepack, then run:

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install --frozen-lockfile
cp config/environment.sample .env
pnpm dev
```

The `config/environment.sample` file documents supported variables without containing credentials. The Manus-hosted development environment injects several service variables automatically; when developing elsewhere, configure only the integrations you intend to run. Keep `.env`, database credentials, service-role keys, relay tokens, and signing secrets outside Git.

## Development commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the API server and Expo web development server |
| `pnpm android` | Start Expo for an Android emulator or connected device |
| `pnpm check` | Run the TypeScript compiler without emitting files |
| `pnpm lint` | Run Expo ESLint checks |
| `pnpm test` | Run the offline Vitest suite; external live checks remain skipped by default |
| `pnpm build` | Bundle the production Node server |

Live Gemini, Gmail relay, Supabase connection, and central-registration tests are opt-in through the `RUN_*_LIVE_TEST` flags documented in `config/environment.sample`. Enable them only in an approved environment that already contains the corresponding credentials; the default GitHub Actions workflow never receives those production secrets.

## Working with GitHub Copilot

Clone this private repository in VS Code or open it in GitHub Codespaces, install or enable GitHub Copilot, and open the repository root as the workspace. Repository-specific guidance is stored in `.github/copilot-instructions.md`; it describes the architecture, Arabic RTL conventions, privacy constraints, and required validation commands.

Before accepting a Copilot-generated change, review the diff and run:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

## Security and clinical-data boundary

Use synthetic identifiers and fictional clinical examples in source code and tests. Notifications must not contain patient names, record numbers, diagnoses, or other clinical details. Never paste secrets or real clinical records into Copilot prompts, issues, pull requests, logs, screenshots, or commits. Production use requires an institutional security and privacy review, controlled identity management, auditability, encrypted storage and transport, and approved data-retention policies.
