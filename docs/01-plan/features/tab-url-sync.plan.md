# Plan: tab-url-sync

**Feature ID**: tab-url-sync
**Date**: 2026-04-11
**Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 로비 탭(심연의재련/침식의 정화소) 선택 상태가 React state에만 저장되어 새로고침 시 항상 첫 탭으로 초기화됨 |
| **Solution** | `useSearchParams`로 탭 상태를 URL 쿼리 파라미터(`?tab=루드라`)에 동기화 |
| **UX Effect** | 새로고침·공유 링크 모두 선택한 탭을 유지. 브라우저 뒤로/앞으로 탐색도 탭 전환과 연동 |
| **Core Value** | URL 한 줄 복사로 원하는 탭 상태를 공유·북마크 가능 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 탭 상태가 휘발성이라 새로고침마다 UX 흐름이 끊김 |
| **WHO** | 로비를 자주 새로고침하거나 링크를 공유하는 유저 |
| **RISK** | 없음 (기존 라우트 구조 변경 없음) |
| **SUCCESS** | `/?tab=루드라` URL로 직접 접근 시 해당 탭이 선택됨 |
| **SCOPE** | `LobbyPage.jsx` 단일 파일 — `useSearchParams` 교체만 |

---

## 1. 기능 요구사항

| ID | 기능 |
|----|------|
| FR-01 | 탭 클릭 시 URL을 `/?tab=<탭명>` 으로 업데이트 |
| FR-02 | 페이지 로드 시 URL의 `tab` 파라미터로 초기 탭 결정 |
| FR-03 | 파라미터 없거나 유효하지 않으면 첫 번째 탭(루드라) 기본값 |

---

## 2. 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/LobbyPage.jsx` | `useState` → `useSearchParams` 교체, 탭 전환 시 setSearchParams 호출 |

---

## 3. 성공 기준

- `/?tab=침식의 정화소` 접근 시 두 번째 탭 활성화
- 탭 클릭 후 새로고침 시 같은 탭 유지
- 파라미터 없이 접근 시 첫 번째 탭 기본값
