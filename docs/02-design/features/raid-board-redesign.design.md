# Design: raid-board-redesign

**Feature ID**: raid-board-redesign
**Date**: 2026-04-11
**Phase**: Design
**Architecture**: Option B — SlotRow 컴포넌트 분리

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 모달이 너무 커서 파티 구성을 한눈에 볼 수 없음 → 빠른 신청 결정 방해 |
| **WHO** | 공대 신청자 (로그인 유저) — 여러 공대를 비교하며 캐릭터 선택 결정 |
| **RISK** | 새 컴포넌트 분리 시 JOB_STYLE_MAP/formatPowerK import 경로 주의. 모바일 반응형 CSS 회귀 가능성 |
| **SUCCESS** | 8인 파티 기준 스크롤 없이 전체 슬롯 확인 가능 |
| **SCOPE** | SlotRow.jsx 신규 + RaidModal.jsx 수정 + raid-modal-panel.css 수정 |

---

## 1. Overview

### 1.1 선택한 아키텍처: Option B — SlotRow 컴포넌트 분리

슬롯 렌더링 로직을 독립 컴포넌트 `SlotRow`로 추출한다. `RaidModal`은 파티 데이터를 SlotRow에 전달하는 역할만 수행. CSS는 기존 파일에 새 클래스 추가 방식으로 확장한다.

### 1.2 아키텍처 비교

| 항목 | Option A (CSS만) | **Option B (SlotRow 분리)** | Option C (인라인 재구성) |
|------|-----------------|----------------------------|--------------------------|
| 파일 추가 | 0 | 1 (SlotRow.jsx) | 0 |
| JSX 변경량 | 최소 | 중간 | 중간 |
| 재사용성 | 낮음 | 높음 | 낮음 |
| 가독성 | 보통 | 높음 | 보통 |
| 롤백 용이성 | 쉬움 | 쉬움 | 쉬움 |

---

## 2. 파일 구조

```
src/
├── components/
│   └── raid/
│       ├── RaidModal.jsx          (수정)
│       └── SlotRow.jsx            (신규)  ← 핵심 신규 파일
└── styles/
    └── raid-modal-panel.css       (수정)  ← 너비, 슬롯 CSS
```

---

## 3. 컴포넌트 설계

### 3.1 SlotRow.jsx (신규)

**Props:**

| prop | type | 설명 |
|------|------|------|
| `member` | `object \| null` | characters row. null이면 빈 자리 |
| `isMe` | `boolean` | 현재 로그인 유저의 캐릭터 여부 |

**렌더링 구조:**

```jsx
// 신청자 슬롯 (1행)
<div className="slot-row [slot-row--mine]">
  <span className={`raid-modal-job-pill ${JOB_STYLE_MAP[member.job]}`}>
    {member.job}
  </span>
  <span className="slot-row-name">{member.name}</span>
  {isMe && <span className="slot-row-badge">나</span>}
  <span className={`slot-row-power ${getPowerTierClass(member.power)}`}>
    {formatPowerK(member.power)}
  </span>
</div>

// 빈 자리
<div className="slot-row empty">
  <span className="slot-row-empty">빈 자리</span>
</div>
```

**Import 목록:**

```js
import { JOB_STYLE_MAP, formatPowerK, getPowerTierClass } from "../../utils/myPageHelpers";
import "../../styles/raid-modal-panel.css";
```

---

### 3.2 RaidModal.jsx (수정)

**변경 사항:**

1. `SlotRow` import 추가
2. 슬롯 렌더링 부분 교체: 기존 `party.slots.map()` → `sortedSlots.map()`
3. 빈 자리 정렬 로직 추가 (렌더링 직전)
4. 모달 너비는 CSS 변경으로 처리 (JSX 변경 없음)

**빈 자리 정렬 로직 (렌더링 직전):**

```js
const sortedSlots = [...party.slots].sort((a, b) => {
  if (a && !b) return -1;
  if (!a && b) return 1;
  return 0;
});
```

**슬롯 렌더링 교체:**

```jsx
// 기존 (제거)
<div className="raid-modal-slot-list">
  {party.slots.map((member, index) => { ... })}
</div>

// 변경 후
<div className="raid-modal-slot-list">
  {sortedSlots.map((member, index) => (
    <SlotRow
      key={index}
      member={member}
      isMe={
        member != null &&
        myCharacterId != null &&
        String(member.id) === String(myCharacterId)
      }
    />
  ))}
</div>
```

---

## 4. CSS 설계

### 4.1 모달 너비 변경

```css
/* 기존 */
.raid-modal {
  width: min(100%, 980px);
}

/* 변경 */
.raid-modal {
  width: min(100%, 860px);
}
```

### 4.2 SlotRow 신규 클래스

```css
/* ============================= */
/* SlotRow (1행 슬롯) */
/* ============================= */
.slot-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  min-height: 0;
}

.slot-row.empty {
  justify-content: center;
  background: #f3f4f6;
  border-style: dashed;
  border-color: rgba(15, 23, 42, 0.12);
  padding: 6px 12px;
}

.slot-row--mine {
  border-color: rgba(79, 70, 229, 0.28);
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.10), transparent 50%),
    linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
}

.slot-row-name {
  flex: 1;                /* 남은 공간 모두 차지 */
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-row-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  font-size: 10px;
  font-weight: 900;
  flex-shrink: 0;
}

.slot-row-power {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  flex-shrink: 0;
  min-width: 52px;
  text-align: right;
}

.slot-row-empty {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
}
```

### 4.3 기존 클래스 처리

- `.raid-modal-slot`, `.raid-modal-slot-header`, `.raid-modal-slot-meta-row`, `.raid-modal-slot-power-box` → **제거하지 않음** (롤백 안전망). 새 `.slot-row`와 충돌 없음 (다른 DOM 구조)
- `.raid-modal-slot-list` — `gap` 값을 `10px → 6px`으로 줄임

---

## 5. 데이터 흐름

```
buildRaidParties(applications)
  └─ parties[]: { name, slots: (member|null)[], hasRequiredSupport, averagePower }
       └─ RaidModal 렌더링 시
            └─ sortedSlots = [...party.slots].sort(nullsLast)
                 └─ <SlotRow member={m} isMe={boolean} />
```

DB 변경 없음. hooks 변경 없음.

---

## 6. 레이아웃 목표 수치

| 항목 | 현재 | 목표 |
|------|------|------|
| 모달 최대 너비 | 980px | 860px |
| 슬롯 1개 높이 | ~96px (min-height) | ~38px (padding 8px×2 + 내용) |
| 빈 자리 높이 | ~72px | ~32px |
| 8인 파티 섹션 높이 (슬롯8 + gap7) | ~860px | ~360px |

---

## 7. 반응형

```css
/* 기존 반응형 유지 */
@media (max-width: 900px) {
  .raid-modal-party-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .raid-modal { width: 100%; border-radius: 22px; }
  /* slot-row는 flex-row 그대로 — 너비가 줄어도 동작 */
}
```

추가 반응형 필요 없음. slot-row는 flex-row로 좁은 화면에서도 자연스럽게 줄어듦.

---

## 8. 테스트 계획

| 항목 | 방법 |
|------|------|
| 8인 파티 전원 신청 시 슬롯 높이 | DevTools 실측 ≤ 380px |
| 빈 자리 하단 정렬 | 3인 신청 + 5빈자리 → 빈자리가 아래 확인 |
| 내 캐릭터 강조(--mine 클래스) | 본인 신청 후 파란 배경 확인 |
| 신청 / 취소 기능 정상 동작 | 수동 클릭 테스트 |
| 모바일(375px) 레이아웃 | DevTools 반응형 모드 |
| 다크모드 | prefers-color-scheme: dark 시 색상 확인 |

---

## 9. 구현 순서

### Module Map

| Module | 파일 | 작업 |
|--------|------|------|
| M1 | `SlotRow.jsx` | 신규 컴포넌트 작성 |
| M2 | `raid-modal-panel.css` | 너비 변경 + `.slot-row` 계열 클래스 추가 + `.raid-modal-slot-list` gap 조정 |
| M3 | `RaidModal.jsx` | SlotRow import, 빈자리 정렬, 슬롯 렌더링 교체 |

### 권장 구현 순서: M1 → M2 → M3

1. `SlotRow.jsx` 작성 (독립 컴포넌트, 먼저 완성)
2. CSS 클래스 추가 (렌더링 전 스타일 준비)
3. RaidModal에서 SlotRow 연결 (마지막 연결)

---

## 10. 롤백 전략

- 기존 `.raid-modal-slot` CSS 클래스는 제거하지 않음
- `SlotRow.jsx` 삭제 + RaidModal 슬롯 섹션 Git revert로 즉시 복구 가능
- CSS 변경은 `.slot-row` 계열만 추가하므로 기존 스타일 영향 없음
