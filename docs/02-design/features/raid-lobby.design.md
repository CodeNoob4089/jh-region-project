# [Design] raid-lobby

**Feature**: 레이드공대 로비 페이지  
**Route**: `/lobby`, `/lobby/new`  
**Created**: 2026-04-11  
**Phase**: Design  

---

## Context Anchor

| 항목 | 내용 |
|---|---|
| WHY | 어드민 의존 없이 회원이 자율적으로 공격대를 구성·참가할 수 있어야 함 |
| WHO | 레이드에 참여하고 싶은 모든 로그인 회원 |
| RISK | created_by NULL 기존 방 예외처리, 직업 아이콘 에셋 없음 |
| SUCCESS | 탭 필터·출발시간·파티슬롯 인라인 표시, 방 생성·신청·삭제 전 흐름 동작 |
| SCOPE | /lobby 신규, /lobby/new 신규, 기존 /, /raids 변경 없음 |

---

## 1. Overview

### 아키텍처 선택: Option C — Pragmatic Balance

기존 코드(`useRaids`, `RaidModal`, `buildRaidParties`, `raid-form.css`)를 최대한 재사용하고,
새 컴포넌트는 로비 전용 UI 부분만 신규 작성.

**근거**:
- `AdminRaidCreatePage`가 이미 `created_by: user.id`를 insert함 → DB 컬럼 이미 존재 가능성 높음
- `RaidModal` apply/cancel 로직 완전 재사용 → 중복 없이 host 삭제 버튼만 추가
- `buildRaidParties`로 파티 슬롯 데이터 그대로 활용

---

## 2. DB 확인 및 변경

### 2-1. created_by 컬럼
`AdminRaidCreatePage`가 이미 `created_by: user.id`를 전달하므로, 컬럼이 없으면 Supabase가 에러를 냈을 것.
→ **먼저 Supabase 대시보드에서 컬럼 존재 여부 확인 후** 없으면 추가.

```sql
-- 없을 경우에만 실행
ALTER TABLE raids
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### 2-2. RLS 정책 (Supabase Dashboard → Authentication → Policies)

| 테이블 | 정책 | 조건 |
|---|---|---|
| raids | INSERT | `auth.uid() IS NOT NULL` |
| raids | UPDATE | `created_by = auth.uid()` |
| raids | DELETE | `created_by = auth.uid()` |

> 기존 어드민 방(created_by = NULL)은 어드민이 직접 Supabase 대시보드에서 관리.

### 2-3. 데이터 모델 매핑

| 화면 표시 | DB 컬럼 | 비고 |
|---|---|---|
| 방 이름 | `description` | 방장이 자유 입력하는 방 설명/이름 |
| 레이드 탭 | `title` | "심연의재련: 루드라" / "침식의 정화소" |
| 출발 시간 | `raid_date` + `start_time` | M/D(요일) HH:mm 포맷 |
| 파티 슬롯 | `raid_applications` → `buildRaidParties()` | 기존 로직 재사용 |
| 방장 여부 | `created_by === user.id` | 삭제 버튼 표시 조건 |

---

## 3. 신규 파일 목록

```
src/
  pages/
    LobbyPage.jsx          ← 메인 로비 페이지 (탭 + 정렬 + 카드 리스트)
    LobbyCreatePage.jsx    ← 방 생성 폼 (모든 회원)
  components/
    lobby/
      LobbyCard.jsx        ← 파티 슬롯 인라인 카드 컴포넌트
  styles/
    lobby.css              ← 로비 전용 스타일
```

---

## 4. 수정 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/App.jsx` | `/lobby`, `/lobby/new` 라우트 추가 |
| `src/components/Sidebar.jsx` | "로비" NavLink 추가 |
| `src/components/raid/RaidModal.jsx` | 방장 삭제 버튼 추가 (isHost 조건) |

---

## 5. 컴포넌트 설계

### 5-1. LobbyPage (`/lobby`)

```
State:
  activeTab: "심연의재련: 루드라" | "침식의 정화소"  (기본: 첫 번째)
  sortOrder: "time" | "status"  (기본: "time")
  selectedRaid: raid | null

Data:
  useRaids() → raids (실시간 구독 포함)
  useMyApplications(user) → myAppliedRaidIds (Set)

Derived:
  filteredRaids = raids
    .filter(r => r.title === activeTab)
    .sort(by sortOrder)

정렬 기준:
  time  → raid_date ASC, start_time ASC
  status → 신청가능 → 신청완료 → 마감 순

JSX 구조:
  <Layout>
    <div.lobby-page>
      <div.lobby-header>
        <h1>레이드공대 로비</h1>
        <div.lobby-header-actions>
          <select.lobby-sort-select> (시간순/상태순)
          {user && <Link to="/lobby/new">+ 방 만들기</Link>}
        </div>
      </div>

      <div.lobby-tabs>
        {RAID_TYPES.map(type => <button.lobby-tab>)}
      </div>

      <div.lobby-list>
        {filteredRaids.map(raid => (
          <LobbyCard
            key={raid.id}
            raid={raid}
            isMyApplied={myAppliedRaidIds.has(String(raid.id))}
            onClick={() => setSelectedRaid(raid)}
          />
        ))}
      </div>
    </div>

    {selectedRaid && (
      <RaidModal
        raid={selectedRaid}
        onClose={() => setSelectedRaid(null)}
        onApplied={refetchRaids}
      />
    )}
  </Layout>
```

### 5-2. LobbyCard (`src/components/lobby/LobbyCard.jsx`)

```
Props:
  raid        - raid 객체 (parties, current_members, max_members 포함)
  isMyApplied - boolean
  onClick     - 클릭 핸들러

Derived:
  isFull    = current_members >= max_members
  isDisabled = isFull && !isMyApplied
  parties   = raid.parties  (buildRaidParties 결과, useRaids에서 이미 계산됨)

버튼 상태:
  isMyApplied  → "신청완료" (클릭 가능, 모달에서 취소)
  !isDisabled && current_members === 0 → "즉시 가입"
  !isDisabled && current_members > 0  → "참가 신청"
  isDisabled   → "마감" (disabled)

JSX:
  <div.lobby-card [is-applied] [is-disabled] [is-full]>
    <div.lobby-card-info>
      <div.lobby-card-name>  {raid.description || "방 이름 없음"}
      <div.lobby-card-meta>  {formatDateWithDay} · {formatTime}  {current}/{max}
    </div>

    <div.lobby-card-parties>
      {parties.map(party => (
        <div.lobby-party-row>
          <span.lobby-party-label>  {party.name}
          <div.lobby-party-slots>
            {party.slots.map((member, i) => (
              <div.lobby-slot [filled] [support]>
                {member
                  ? <span.lobby-slot-job JOB_STYLE_MAP[member.job]> {member.job[0]}
                  : <span.lobby-slot-empty>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div.lobby-card-action>
      <button.lobby-apply-btn [variant]>
        {버튼 텍스트}
      </button>
    </div>
  </div>
```

### 5-3. LobbyCreatePage (`/lobby/new`)

`AdminRaidCreatePage`를 베이스로 변경 사항:

| 항목 | 기존 AdminRaidCreatePage | LobbyCreatePage |
|---|---|---|
| 접근 권한 | 로그인 필요 (어드민 아님) | 로그인 필요 (동일) |
| 레이드 종류 | `<select>` 드롭다운 | `<select>` 드롭다운 (동일) |
| 방 이름 입력 | title이 방 이름 역할 | description 필드를 "방 이름"으로 사용, 필수값으로 변경 |
| 생성 후 이동 | `/raids` | `/lobby` |
| created_by | 이미 포함 | 동일 |

```
Form 필드:
  레이드 종류 (title): select → "심연의재련: 루드라" / "침식의 정화소"
  방 이름 (description): text input, 필수, placeholder="예: 트라이엇, 300K+ 4딜"
  날짜: date input
  출발 시간: 시/분 select
  설명 (description2): 추가 없음 (description을 방 이름으로 사용하므로)

  → 생성 insert:
    title: 선택한 레이드 종류
    description: 방 이름 (필수)
    raid_date, start_time, max_members: 8 고정
    created_by: user.id
```

### 5-4. RaidModal 수정 (최소 변경)

```jsx
// 추가할 부분만:
const isHost = raid?.created_by && String(raid.created_by) === String(user?.id);

const handleDeleteRaid = async () => {
  // confirm → supabase.from("raids").delete().eq("id", raid.id)
  // success → onClose() + onApplied()
};

// JSX: 헤더 우측에 방장 삭제 버튼 추가
{isHost && (
  <button className="raid-modal-delete-button" onClick={handleDeleteRaid}>
    방 삭제
  </button>
)}
```

---

## 6. 라우터 변경 (`src/App.jsx`)

```jsx
import LobbyPage from "./pages/LobbyPage";
import LobbyCreatePage from "./pages/LobbyCreatePage";

// 기존 routes에 추가:
<Route path="/lobby" element={<LobbyPage />} />
<Route path="/lobby/new" element={<LobbyCreatePage />} />
```

---

## 7. 사이드바 변경 (`src/components/Sidebar.jsx`)

```jsx
// "메뉴" 섹션에 추가:
<NavLink to="/lobby" ...>
  레이드공대 로비
</NavLink>

// "공격대" 섹션 user 조건 내에 추가:
<NavLink to="/lobby/new" ...>
  방 만들기
</NavLink>
```

---

## 8. CSS 설계 (`src/styles/lobby.css`)

```
.lobby-page            - 페이지 컨테이너
.lobby-header          - 제목 + 액션 버튼 행
.lobby-tabs            - 탭 컨테이너
.lobby-tab             - 탭 버튼 (is-active 상태)
.lobby-list            - 카드 리스트
.lobby-card            - 카드 컨테이너 (is-applied, is-disabled, is-full)
.lobby-card-info       - 방 이름 + 시간 + 인원
.lobby-card-name       - 방 이름 텍스트
.lobby-card-meta       - 날짜/시간/인원 메타
.lobby-card-parties    - 파티 슬롯 영역
.lobby-party-row       - 1파티/2파티 행
.lobby-party-label     - "1파티" 레이블
.lobby-party-slots     - 슬롯 4개 그리드
.lobby-slot            - 개별 슬롯 (filled, support)
.lobby-slot-job        - 직업 배지 (JOB_STYLE_MAP 클래스 적용)
.lobby-slot-empty      - 빈 슬롯
.lobby-card-action     - 버튼 영역
.lobby-apply-btn       - 신청/마감 버튼

raid-modal-delete-button  - RaidModal에 추가되는 방장 삭제 버튼
```

---

## 9. 상수 정의

`LobbyPage.jsx` 내부에 정의:
```js
const RAID_TYPES = ["심연의재련: 루드라", "침식의 정화소"];
```

> `useRaids()`의 정렬 기준(`titleOrder`)에 이미 동일 목록이 있으므로 추후 공통 상수로 분리 가능.

---

## 10. 구현 순서

| 순서 | 작업 | 비고 |
|---|---|---|
| 1 | Supabase `created_by` 컬럼 + RLS 정책 확인/설정 | 대시보드에서 수동 작업 |
| 2 | `src/styles/lobby.css` 스타일 파일 작성 | |
| 3 | `src/components/lobby/LobbyCard.jsx` 컴포넌트 작성 | |
| 4 | `src/pages/LobbyPage.jsx` 페이지 작성 | LobbyCard + useRaids + RaidModal |
| 5 | `src/pages/LobbyCreatePage.jsx` 작성 | AdminRaidCreatePage 기반 |
| 6 | `src/App.jsx` 라우트 추가 | |
| 7 | `src/components/Sidebar.jsx` 네비 추가 | |
| 8 | `src/components/raid/RaidModal.jsx` 방장 삭제 버튼 추가 | |
