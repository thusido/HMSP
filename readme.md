# HMSP — HMSubtitlePlayer

> Yet another wheel, slightly different.

An audiobook-style continuous document subtitle reader synchronized with audio playback.

> 한국어 안내: [`readme.ko.md`](./readme.ko.md)

![HMSP main screen](.github/screenshots/main.png)

## Features

- Folder/file intake (drag & drop, file picker — audio + subtitles together)
- Automatic subtitle matching + manual attach
- Cue click-to-seek, prev/next subtitle and file navigation
- Playback speed, volume, single-track repeat
- Refresh reconnect for moved files (filename-led 2-pass matching)
- Themes (light/dark/system), JSON backup & restore

| Light drawer | Dark | Dark drawer |
|---|---|---|
| ![drawer open](.github/screenshots/main_drawer.png) | ![dark mode](.github/screenshots/dark_main.png) | ![drawer open, dark](.github/screenshots/dark_main_drawer.png) |

## Download

Grab a build from [Releases](https://github.com/thusido/HMSP/releases).

| OS | File |
|----|------|
| macOS (arm64) | `.dmg` |
| Windows (x64) | `-setup.exe` / `.msi` |
| Android (arm64) | `-signed.apk` |
| iPadOS | PWA `dist/` artifact (add to Home Screen, then offline) |

These are unsigned test builds:

- **macOS**: copy to Applications, then **right-click → Open**. If it still
  refuses ("damaged"), clear quarantine (only for this self-built app):
  `xattr -dr com.apple.quarantine /Applications/HMSubtitlePlayer.app`
- **Windows**: on the SmartScreen "unknown publisher" prompt,
  click **More info → Run anyway**.
- **Android**: allow installs from unknown sources first.

## Development

Prerequisites: Node LTS, pnpm 10, Rust stable.
Android additionally needs the Android Studio SDK (see below).

```bash
pnpm install
pnpm dev          # web dev server (:5173)
pnpm build        # web / Tauri frontend build
pnpm build:pwa    # PWA build (Service Worker + manifest)
pnpm test         # vitest
pnpm tauri dev    # desktop shell
pnpm tauri build  # desktop installer
```

### Reproduce from git

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

Verify every increment: `pnpm exec tsc -b`, `pnpm test`, `pnpm build`,
and flex-lint (`rg 'w-\[.*px\]|min-w-\[|text-\[[0-9]+px\]' src` must be empty).

## License

MIT — see [LICENSE](./LICENSE).
