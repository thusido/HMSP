# HMSP — HMSubtitlePlayer (한국어 안내)

오디오북처럼 흘러가는 연속 문서 자막 리더 + 오디오 동기 재생 앱.

## 대상 (웹 코어 1개 + 플랫폼별 어댑터)

| 대상 | 패키징 | 산출물 |
|------|--------|--------|
| macOS | Tauri v2 | `.app` / `.dmg` |
| Windows | Tauri v2 | `.exe` / `.msi` |
| Android | Tauri v2 Mobile | `.apk` |
| iPadOS | Vite PWA → 최초 1회 네트워크에서 로드 후 오프라인 실행 (홈 화면에 추가) | `dist/` |

## 빠른시작

```bash
pnpm install
pnpm dev
pnpm build
pnpm build:pwa
pnpm test
```

## 레이아웃 (계승, flex-first)

`앱바 → 리더 → 재생바` 수직 구조. 와이드(≥768px)는 Drawer PUSH, 모바일은 scrim OVERLAY.
재생 버튼 순서 고정: `[이전파일][이전자막][재생][다음자막][다음파일]`.
레이아웃은 flexbox(`flex-1`, `min-w-0`) 사용, 고정 px 너비 금지.

## 불변규칙

1. 원본 미디어 파일은 읽기 전용 (수정·삭제 금지).
2. 자막이 깨져도 재생은 멈추지 않음.
3. 공간 우선순위: 리더 > 재생바 > 서랍.
4. `confirm`/`prompt` 금지 — 비동기 커스텀 모달 사용.

## 아이콘

`HMSP_user_icon/` 원본에서 적용 완료 (Tauri icns/ico/png, PWA 192/512, 파비콘 16/32, apple-touch 180).
원본 변경 시 `pnpm icons` 재실행 (PNG 리사이즈는 macOS `sips` 필요).
