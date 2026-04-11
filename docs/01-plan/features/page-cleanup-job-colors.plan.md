# Plan: 미사용 페이지 제거 + 직업 색상 통일

## Executive Summary

| 관점 | 내용 |
|------|------|
| 문제 | 모달 전환 이후 사용하지 않는 Admin/History 페이지가 라우트에 잔존하고, raid.css 정리 과정에서 직업 뱃지 색상이 소실됨 |
| 해결 | 불필요한 11개 페이지·9개 CSS 파일 삭제 및 라우트 정리, 뱃지 스타일 복구 + 신규 색상 체계 적용 |
| UX 효과 | 번들 크기 감소, 직업별 명확한 색상 식별성 확보 |
| 핵심 가치 | 코드베이스 단순화 + 시각적 일관성 |

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 로비 통합 이후 관리 페이지들이 모달로 대체되었으나 구버전 파일이 잔존 |
| WHO | 개발자 (코드 유지보수), 플레이어 (색상 식별) |
| RISK | 삭제된 CSS의 의존성 누락 → 빌드 에러 가능성 |
| SUCCESS | 빌드 성공, 뱃지 색상 정상 표시, 미사용 파일 전부 제거 |
| SCOPE | App.jsx, src/pages/*, src/styles/*, raid-modal-panel.css, lobby.css, my-page.css |

## 1. 요구사항

### 1.1 페이지 제거
삭제된 페이지 (JSX):
- HomePage, LobbyCreatePage, RaidsPage
- AdminRaidCreatePage, AdminRaidEditPage, AdminRaidDetailPage
- AdminRaidsPage, AdminDashboardPage, RaidDetailPage
- RaidHistoryPage, RaidHistoryDetailPage

삭제된 CSS:
- admin-dashboard.css, admin-raid-detail.css, admin-raid-edit.css, admin-raids.css
- home-raid-slider.css, raid-detail.css, raid-form.css
- raid-history.css, raid-history-detail.css

### 1.2 직업 뱃지 버그 수정
- raid.css 정리 시 `.raid-modal-job-pill.job-*` 컴파운드 셀렉터 소실
- raid-modal-panel.css에 복구

### 1.3 직업 색상 체계

| 직업 | 색상명 | color | bg |
|------|--------|-------|----|
| 검성 | 하늘색 | #0284c7 | #e0f2fe |
| 수호성 | 파랑 | #1d4ed8 | #dbeafe |
| 살성 | 옅은녹색 | #65a30d | #ecfccb |
| 궁성 | 녹색 | #16a34a | #dcfce7 |
| 마도성 | 보라색 | #6d28d9 | #ede9fe |
| 정령성 | 분홍 | #be185d | #fce7f3 |
| 호법성 | 주황색 | #c2410c | #ffedd5 |
| 치유성 | 노란색 | #a16207 | #fef9c3 |

적용 대상: raid-modal-panel.css, lobby.css, my-page.css

## 2. 완료 기준
- [ ] App.jsx: LobbyPage + MyPage 2개 라우트만 존재
- [ ] 불필요한 페이지/CSS 파일 삭제 완료
- [ ] 모달 직업 뱃지 색상 정상 표시
- [ ] 로비 슬롯 직업 색상 통일
- [ ] 마이페이지 직업 태그 색상 통일

## 3. 구현 상태

**완료** — 2026-04-12
