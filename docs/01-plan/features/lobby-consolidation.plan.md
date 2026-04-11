# Plan: lobby-consolidation

**Feature ID**: lobby-consolidation
**Date**: 2026-04-11
**Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 공격대 생성·관리·히스토리가 각각 별도 페이지(/raids/new, /raids/manage, /raids/history)에 분산되어 있어 네비게이션 복잡도가 높고 UX 흐름이 끊김 |
| **Solution** | 모든 공격대 기능을 레이드공대 로비(/)에 통합. 생성=모달, 관리=카드 인라인, 히스토리=하단 접어두기 |
| **UX Effect** | 사이드바 메뉴 단순화, 로비 한 화면에서 전체 공대 라이프사이클 관리 가능 |
| **Core Value** | 페이지 이동 없이 공격대 생성·참가·완료처리·히스토리 확인을 원스톱으로 처리 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 분산된 관리 페이지들이 UX를 복잡하게 만듦 → 로비 중심 단일 허브로 통합 |
| **WHO** | 로그인 유저 (공대장 + 참가자) |
| **RISK** | LobbyPage가 비대해질 수 있음. 상태 관리 복잡도 증가. 라우트는 유지하므로 기존 링크 미깨짐 |
| **SUCCESS** | 사이드바에 공격대 관련 메뉴가 없어도 로비에서 모든 기능 사용 가능 |
| **SCOPE** | LobbyPage, LobbyCard, Sidebar, RaidCreateModal(신규). Admin 페이지 라우트는 유지하되 네비 숨김 |

---

## 1. 기능 요구사항

| ID | 기능 | 구현 방식 |
|----|------|----------|
| FR-01 | 공격대 생성 | 로비 우상단 "+ 공격대 생성" 버튼 → 모달 팝업 |
| FR-02 | 공격대 관리 (완료처리/삭제) | LobbyCard 내 본인 공대에만 "완료" / "삭제" 버튼 표시 |
| FR-03 | 공격대 수정 | LobbyCard → "수정" 버튼 → `/raids/:id/edit` 이동 |
| FR-04 | 지난 공대 히스토리 | 로비 하단 접이식(accordion) 섹션 "지난 공대" |
| FR-05 | 사이드바 정리 | "공격대 생성(관리자)", "공격대 관리" 메뉴 제거. "방 만들기" 제거 (로비에서 처리) |
| FR-06 | 기존 관리 페이지 라우트 유지 | URL 직접 접근은 가능하되 사이드바에서 숨김 |

---

## 2. 변경 범위

### 신규 파일
| 파일 | 내용 |
|------|------|
| `src/components/lobby/RaidCreateModal.jsx` | AdminRaidCreatePage 로직을 모달로 래핑 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/pages/LobbyPage.jsx` | RaidCreateModal 상태 관리, 히스토리 섹션 추가, 관리 액션 처리 |
| `src/components/lobby/LobbyCard.jsx` | 본인 공대에 완료처리/수정/삭제 버튼 추가 |
| `src/components/Sidebar.jsx` | 공격대 관련 불필요 메뉴 제거 |
| `src/styles/lobby.css` | 모달, 히스토리 섹션, 관리 버튼 스타일 |

### 변경하지 않는 것
- Admin 페이지 파일들 (라우트 접근은 유지)
- App.jsx 라우트 (그대로)
- DB 스키마, hooks

---

## 3. UI 구조 (목표)

```
레이드공대 로비
├── 헤더: [제목] [정렬] [+ 공격대 생성 버튼]
├── 요약 바
├── 레이드 종류 탭
├── 카드 목록
│   └── LobbyCard
│       ├── 기존: 공대 정보 + 파티 슬롯
│       └── 신규: 본인 공대에 [완료처리] [수정] [삭제] 버튼
│
└── [지난 공대 ▼] 접이식 섹션 (하단)
    └── 완료된 공대 목록 (최근순)
        └── 클릭 → /raids/history/:id 상세 페이지 이동
```

---

## 4. RaidCreateModal 설계

AdminRaidCreatePage의 폼 로직을 그대로 추출. 성공 시 `onCreated()` 콜백으로 로비 새로고침.

```
Props: { isOpen, onClose, onCreated }
내부: 제목 select, 날짜 input, 시간 select(시/분), 설명 textarea
성공: toast + onCreated() + onClose()
```

---

## 5. 지난 공대 히스토리 섹션

- `is_completed = true` 공대를 `completed_at DESC`로 조회
- 로비 하단 accordion (기본 접힘)
- 클릭 시 펼쳐지며 목록 표시
- 각 항목 클릭 → `/raids/history/:id`

---

## 6. LobbyCard 관리 버튼

- `raid.created_by === user.id` 인 경우에만 표시
- 버튼: `[수정]` `[완료처리/활성화]` `[삭제]`
- 삭제: `window.confirm` 후 실행
- 완료처리: `is_completed` toggle → refetch

---

## 7. 사이드바 변경

제거:
- "방 만들기" → 로비 헤더 버튼으로 대체
- "공격대 생성 (관리자)" → 로비 헤더 버튼으로 대체
- "공격대 관리" → 로비 카드 인라인으로 대체
- "지난 공격대 정보" → 로비 하단 섹션으로 대체

유지:
- 레이드공대 로비
- 마이페이지

---

## 8. 성공 기준

| 기준 | 측정 |
|------|------|
| 로비에서 공격대 생성 가능 | 모달 오픈 → 폼 제출 → 목록 갱신 |
| 본인 공대 완료처리/삭제 가능 | 카드 내 버튼 동작 |
| 지난 공대 목록 로비 하단에서 확인 | accordion 열기 → 목록 표시 |
| 사이드바에 불필요 메뉴 없음 | 로비/마이페이지만 남음 |
| 기존 Admin 페이지 URL 직접 접근 가능 | 404 없음 |

---

## 9. 리스크

| 리스크 | 대응 |
|--------|------|
| LobbyPage 비대화 | RaidCreateModal 컴포넌트 분리로 관심사 분리 |
| 히스토리 로딩 지연 | accordion 열 때 lazy fetch (처음엔 요청 안 함) |
| 삭제 시 신청 데이터 정합성 | AdminRaidsPage와 동일한 cascade delete 로직 적용 |
