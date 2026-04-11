import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../layout/Layout";
import useRaids from "../hooks/useRaids";
import useMyApplications from "../hooks/useMyApplications";
import { useAuthContext } from "../context/AuthContext";
import LobbyCard from "../components/lobby/LobbyCard";
import RaidModal from "../components/raid/RaidModal";
import "../styles/lobby.css";

const RAID_TYPES = ["심연의재련: 루드라", "침식의 정화소"];

function getRaidStatusOrder(raid, myAppliedRaidIds) {
  const isFull =
    Number(raid.current_members) >= Number(raid.max_members);
  const isMyApplied = myAppliedRaidIds.has(String(raid.id));

  if (isMyApplied) return 1;
  if (!isFull) return 0;
  return 2;
}

function LobbyPage() {
  const { user } = useAuthContext();
  const { raids, loading, refetchRaids } = useRaids();
  const { myApplications } = useMyApplications(user);

  const [activeTab, setActiveTab] = useState(RAID_TYPES[0]);
  const [sortOrder, setSortOrder] = useState("time");
  const [selectedRaid, setSelectedRaid] = useState(null);

  const myAppliedRaidIds = useMemo(
    () => new Set(myApplications.map((a) => String(a.raid_id))),
    [myApplications]
  );

  const tabCounts = useMemo(() => {
    const counts = {};
    for (const type of RAID_TYPES) {
      counts[type] = raids.filter((r) => r.title === type).length;
    }
    return counts;
  }, [raids]);

  const summary = useMemo(() => ({
    total: raids.length,
    appliedCount: raids.filter((r) => myAppliedRaidIds.has(String(r.id))).length,
  }), [raids, myAppliedRaidIds]);

  const filteredRaids = useMemo(() => {
    const filtered = raids.filter((r) => r.title === activeTab);

    return [...filtered].sort((a, b) => {
      if (sortOrder === "status") {
        const orderA = getRaidStatusOrder(a, myAppliedRaidIds);
        const orderB = getRaidStatusOrder(b, myAppliedRaidIds);
        if (orderA !== orderB) return orderA - orderB;
      }
      // 시간순 (기본 + status 2차 정렬)
      const dateA = new Date(`${a.raid_date}T${a.start_time}`).getTime();
      const dateB = new Date(`${b.raid_date}T${b.start_time}`).getTime();
      return dateA - dateB;
    });
  }, [raids, activeTab, sortOrder, myAppliedRaidIds]);

  if (loading) {
    return (
      <Layout>
        <div className="lobby-page">
          <div className="lobby-empty">공격대 목록 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lobby-page">
        {/* 헤더 */}
        <div className="lobby-header">
          <h1 className="lobby-title">레이드공대 로비</h1>

          <div className="lobby-header-actions">
            <select
              className="lobby-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="time">시간순</option>
              <option value="status">상태순</option>
            </select>

            {user && (
              <Link to="/lobby/new" className="lobby-create-link">
                + 방 만들기
              </Link>
            )}
          </div>
        </div>

        {/* 요약 통계 바 */}
        <div className="lobby-summary-bar">
          <div className="lobby-summary-item">
            <span className="lobby-summary-label">전체 공대</span>
            <span className="lobby-summary-value">{summary.total}</span>
          </div>
          {user && (
            <div className="lobby-summary-item is-accent">
              <span className="lobby-summary-label">내 신청</span>
              <span className="lobby-summary-value">{summary.appliedCount}</span>
            </div>
          )}
        </div>

        {/* 레이드 종류 탭 */}
        <div className="lobby-tabs">
          {RAID_TYPES.map((type) => {
            const count = tabCounts[type] || 0;
            return (
              <button
                key={type}
                type="button"
                className={`lobby-tab ${activeTab === type ? "is-active" : ""}`}
                onClick={() => setActiveTab(type)}
              >
                {type}
                {count >= 1 && (
                  <span className="lobby-tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 카드 리스트 */}
        <div className="lobby-list">
          {filteredRaids.length === 0 ? (
            <div className="lobby-empty">
              등록된 공격대가 없습니다.
              {user && (
                <>
                  {" "}
                  <Link to="/lobby/new" className="lobby-create-link" style={{ display: "inline-flex", marginTop: 12 }}>
                    + 방 만들기
                  </Link>
                </>
              )}
            </div>
          ) : (
            filteredRaids.map((raid) => (
              <LobbyCard
                key={raid.id}
                raid={raid}
                isMyApplied={myAppliedRaidIds.has(String(raid.id))}
                onClick={(r) => setSelectedRaid(r)}
              />
            ))
          )}
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
  );
}

export default LobbyPage;
