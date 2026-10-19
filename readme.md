# HMSP — HMSubtitlePlayer

> Yet another wheel, slightly different.

An audiobook-style continuous document subtitle reader synchronized with audio playback.

> 한국어 안내: [`readme.ko.md`](./readme.ko.md)

![HMSP main screen](.github/screenshots/main.png)

## Features

- Folder/file intake by drag & drop or file picker — audio and subtitles together
- Whole-document reader: cues render as flowing paragraphs, and only the sentence being
  spoken is highlighted (the rest is never dimmed)
- Click a sentence to seek; a text selection wins over the click
- Automatic subtitle matching (`name.vtt` or `name.ext.vtt`, case-insensitive, single candidate
  only) plus manual attach
- Prev/next subtitle and prev/next file navigation within the current folder
- Playback speed 0.5–1.5×, volume, single-track repeat
- Reader typography: four bundled typefaces (Pretendard, Noto Serif KR, SUIT, Ridibatang) with
  size, letter-spacing and line-height controls
- Themes (light/dark/system) and UI language (Korean/English)
- Refresh reconnect for moved files (filename-led two-pass matching)
- JSON playlist backup and restore
- Plain text (`txt`) as a reading-only companion

## Supported files

| Kind | Extensions | Notes |
|---|---|---|
| Audio | `wav` · `mp3` · `m4a` | Plays with missing, broken or mismatched subtitles |
| Subtitles | `vtt` · `srt` | Auto-attach only when the filename resolves to a single candidate |
| Text | `txt` | Reader only — no cue seeking |

## Screenshots

| Light drawer | Dark |
|---|---|
| ![drawer open](.github/screenshots/main_drawer.png) | ![dark mode](.github/screenshots/dark_main.png) |

| Dark drawer | Settings |
|---|---|
| ![drawer open, dark](.github/screenshots/dark_main_drawer.png) | ![settings](.github/screenshots/settings.png) |

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

iOS and iPadOS cannot be installed from a release build:

- **PWA**: host the PWA build with an iOS local terminal app such as a-Shell, then add it to the
  Home Screen from Safari and use it offline.
- The same route works on any environment that supports installing a PWA, not only the iOS family.

## Development

Tech stack: TypeScript, React 19, Vite 6, Tailwind CSS 3, Tauri v2, Vitest.
Platform differences are isolated in `src/services/platform/PlatformAdapter`; the Tauri adapter
is lazy-loaded so web/PWA bundles exclude `@tauri-apps/*`.

Prerequisites: Node LTS, pnpm 10, Rust stable (rustup — Homebrew cargo lacks the Android
targets). Android additionally needs the Android Studio SDK (see below).

```bash
pnpm install
pnpm dev          # web dev server (:5173)
pnpm build        # web / Tauri frontend build
pnpm build:pwa    # PWA build — the only build with a Service Worker (VITE_PWA=true)
pnpm test         # vitest
pnpm tauri dev    # desktop shell
pnpm tauri build  # desktop installer
```

Verify every increment:

```bash
pnpm exec tsc -b
pnpm test
pnpm build
rg 'w-\[.*px\]|min-w-\[|text-\[[0-9]+px\]' src   # must be empty (flex-first layout)
```

### Reproduce from git

`src-tauri/gen/` is git-ignored by design.
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

## Font licenses

The bundled fonts are covered by the **SIL Open Font License (OFL) version 1.1**, separately from
the project license. Every font used in this project is a redistribution of a font released under
OFL 1.1:

| Font | Files | License |
|---|---|---|
| Pretendard | `src/assets/fonts/pretendard/` | SIL OFL 1.1 |
| Noto Serif KR | `src/assets/fonts/noto-serif-kr/` | SIL OFL 1.1 |
| SUIT | `src/assets/fonts/suit/` | SIL OFL 1.1 |
| Ridibatang | `src/assets/fonts/ridibatang/` | SIL OFL 1.1 |

The full license text is in [`public/SIL OFL 1.1.md`](./public/SIL%20OFL%201.1.md) and ships with
builds. Each font directory also carries its own `OFL.txt` / `LICENSE.txt`.

## License

MIT — see [LICENSE](./LICENSE).
