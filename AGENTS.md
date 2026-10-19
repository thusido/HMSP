# HMSP agent instructions

React 19 + Vite 6 + Tailwind 3 + Tauri 2 (desktop/Android) + PWA. pnpm 10, Node LTS, Rust stable (rustup; Homebrew cargo lacks Android targets).

## Commands

- `pnpm dev` (:5173), `pnpm build` (web/Tauri frontend), `pnpm build:pwa` (only build with Service Worker, `VITE_PWA=true`), `pnpm test` (vitest), `pnpm tauri dev|build`, `pnpm icons` (copy-icons).
- Verify every increment, in order: `pnpm exec tsc -b`, `pnpm test`, `pnpm build`, then flex-lint `rg 'w-\[.*px\]|min-w-\[|text-\[[0-9]+px\]' src` (must be empty).
- Single test: `pnpm vitest run <path>` (tests colocate as `*.test.ts` next to services).
- Same as CI (`check.yml` on main PR/push): install --frozen-lockfile → tsc → test → build.

## Architecture

- Entry `src/main.tsx` → `src/App.tsx` wires 3 feature hooks: `features/playback/usePlayback`, `features/playlist/usePlaylist`, `features/reader/useReader`.
- Logic lives in `services/` (`audio/`, `platform/PlatformAdapter`, `playback/navigation`, `playlist/`, `subtitle/`); UI in `components/`; strings in `i18n/STRINGS[lang]`.
- Tauri config `src-tauri/tauri.conf.json5`: `dragDropEnabled: false` is intentional (HTML5 DnD owns all drops); CSP + asset protocol scope `**` required for local media.
- `src-tauri/gen/`, `docs/`, `HMSP_user_icon/` are git-ignored by design. Fresh clone: `pnpm install`, `pnpm tauri android init`, `pnpm tauri icon <png>` (see readme "Reproduce from git").

## Gotchas (do not rediscover)

- Release tag MUST equal app version in 3 files: `package.json`, `src-tauri/tauri.conf.json5`, `src-tauri/Cargo.toml`.
- Release (`release.yml`, on `v*` + manual): PWA `dist/` artifact (iPadOS), desktop via tauri-action, Android via `android init` + `icon` every run then `android build --split-per-abi`. apksigner needs space form `--ks-pass pass:xxx`. `pnpm/action-setup` takes no `version:` key; never use `setup-android@v3` (preinstalled SDK + NDK 28.2.13676358, JDK 21; local macOS: `ANDROID_HOME=$HOME/Library/Android/sdk`, `NDK_HOME=$ANDROID_HOME/ndk/<ver>`, JDK 17+).
- Tailwind: token keys must be kebab-case (camelCase never generates utilities); `darkMode: 'class'` with custom colors (`paper/ink/night/...`); no arbitrary px widths/text sizes (use spacing scale / `text-*` scale).
- zsh: split same-line `export`s (empty expansion bug).
- Keystore loss = no signed Android updates; backup reminder lives with user.

## Session

- Respond in Korean, minimal diffs.
- Git local-first (GitHub = mirror): commit per unit, WIP stays local, push at completion (auto, no ask). Pre-commit: status/diff review, no secrets/binaries. Never amend pushed commits.
- No prior context: read `docs/HANDOFF.md` first (rolling, local-only), then `docs/ROADMAP.md` (current state + backlog index). Session close: update HANDOFF (position, next, new gotchas).
