# HMSP — HMSubtitlePlayer

An audiobook-style continuous document subtitle reader synchronized with audio playback.

> 한국어 안내: [`readme.ko.md`](./readme.ko.md)

## Targets (one web core, adapters per platform)

| Target | Packaging | Output |
|--------|-----------|--------|
| macOS | Tauri v2 | `.app` / `.dmg` |
| Windows | Tauri v2 | `.exe` / `.msi` |
| Android | Tauri v2 Mobile | `.apk` |
| iPadOS | Vite PWA → load once over network, then offline via Service Worker (add to Home Screen) | `dist/` |

## Quickstart

```bash
pnpm install
pnpm dev          # web dev server (:5173)
pnpm build        # web / Tauri frontend build
pnpm build:pwa    # PWA build (Service Worker + manifest)
pnpm test         # vitest
pnpm tauri dev    # desktop shell
pnpm tauri build  # desktop installer
```

## Reproduce from git

`src-tauri/gen/`, `docs/`, and `HMSP_user_icon/` are git-ignored by design.
After cloning:

```bash
pnpm install
pnpm tauri android init   # regenerates src-tauri/gen (Android SDK required)
pnpm tauri icon <png>     # regenerates all icons incl. Android mipmap
pnpm tauri android build  # or: pnpm tauri build (desktop)
```

Android env (macOS + Android Studio SDK): `ANDROID_HOME=$HOME/Library/Android/sdk`,
`NDK_HOME=$ANDROID_HOME/ndk/<ver>`, JDK 17+; use the rustup stable toolchain
(Homebrew cargo lacks Android targets).

## Layout (inherited, flex-first)

`APP BAR → MAIN READER → PLAYBACK BAR`. Drawer: PUSH on wide (≥768px), OVERLAY with scrim on mobile.
Playback buttons in strict order: `[PrevFile][PrevSub][Play][NextSub][NextFile]`.
Layout uses flexbox (`flex-1`, `min-w-0`); fixed-px widths are banned (see `docs/구현 요구서.md`).

## Invariants

1. Source media files are read-only — never modify/delete them.
2. Broken/missing subtitles never block audio playback.
3. Reader has the highest layout priority: Reader > Playback Bar > Drawer.
4. No sync dialogs (`confirm`/`prompt`) — async custom modals only.

Details: [`docs/기획 문서.md`](./docs/기획%20문서.md) · [`docs/스펙 문서.md`](./docs/스펙%20문서.md) · [`docs/구현 요구서.md`](./docs/구현%20요구서.md)

## Icons

Applied from `HMSP_user_icon/` (user-provided): Tauri `icon.icns`/`.ico`/`.png` + PWA
`192x192`/`512x512` + favicon `16/32` + apple-touch `180`. Re-run `pnpm icons` after any
source change (PNG resizing needs macOS `sips`).
