# HMSP — HMSubtitlePlayer (한국어 안내)

> 조금 모양이 다른 바퀴.

오디오북처럼 흘러가는 연속 문서 자막 리더 + 오디오 동기 재생 앱.

![HMSP 메인 화면](.github/screenshots/main.png)

## 기능

- 폴더/파일 가져오기 (드래그 앤 드롭·파일 선택 — 오디오+자막 일괄)
- 자막 자동 연결 + 수동 연결
- 자막 큐 클릭 탐색, 이전/다음 자막·파일 이동
- 배속·볼륨·한곡반복
- 파일이 옮겨갔을 때 새로고침 재연결 (파일명 기반 2단계 매칭)
- 테마 (라이트/다크/시스템), JSON 백업·복구

| 라이트 서랍 | 다크 | 다크 서랍 |
|---|---|---|
| ![서랍 열림](.github/screenshots/main_drawer.png) | ![다크 모드](.github/screenshots/dark_main.png) | ![서랍 열림, 다크](.github/screenshots/dark_main_drawer.png) |

## 다운로드

[Releases](https://github.com/thusido/HMSP/releases)에서 받으세요.

| OS | 파일 |
|----|------|
| macOS (arm64) | `.dmg` |
| Windows (x64) | `-setup.exe` / `.msi` |
| Android (arm64) | `-signed.apk` |
| iPadOS | PWA `dist/` 아티팩트 (홈 화면에 추가 후 오프라인) |

무서명 테스트 빌드라서 첫 설치 때 안내가 뜹니다:

- **macOS**: Applications에 복사 후 **우클릭 → 열기**로 실행.
  그래도 "손상됨"이 뜨면 quarantine 해제 (직접 빌드한 앱에만 사용):
  `xattr -dr com.apple.quarantine /Applications/HMSubtitlePlayer.app`
- **Windows**: SmartScreen "알 수 없는 게시자"에서 **추가 정보 → 그래도 실행**.
- **Android**: 알 수 없는 출처의 앱 설치를 먼저 허용.

## 개발

준비물: Node LTS, pnpm 10, Rust stable.
Android는 Android Studio SDK 추가 필요 (아래 참고).

```bash
pnpm install
pnpm dev          # 웹 개발 서버 (:5173)
pnpm build        # 웹 / Tauri 프론트엔드 빌드
pnpm build:pwa    # PWA 빌드 (Service Worker + manifest)
pnpm test         # vitest
pnpm tauri dev    # 데스크톱 셸
pnpm tauri build  # 데스크톱 설치본
```

### git에서 재현

`src-tauri/gen/`, `docs/`, `HMSP_user_icon/`은 의도적으로 git에서 제외됩니다.
클론 후:

```bash
pnpm install
pnpm tauri android init   # src-tauri/gen 재생성 (Android SDK 필요)
pnpm tauri icon <png>     # 전 플랫폼 아이콘 재생성 (Android mipmap 포함)
pnpm tauri android build  # 또는: pnpm tauri build (데스크톱)
```

Android 환경 (macOS + Android Studio SDK): `ANDROID_HOME=$HOME/Library/Android/sdk`,
`NDK_HOME=$ANDROID_HOME/ndk/<버전>`, JDK 17+; rustup stable 툴체인 사용
(Homebrew cargo에는 Android 타겟이 없음).

## 라이선스

MIT — [LICENSE](./LICENSE) 참고.
