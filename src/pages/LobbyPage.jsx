import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import useRaids from "../hooks/useRaids";
import useMyApplications from "../hooks/useMyApplications";
import { useAuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LobbyCard from "../components/lobby/LobbyCard";
import RaidModal from "../components/raid/RaidModal";
import RaidCreateModal from "../components/lobby/RaidCreateModal";
import "../styles/lobby.css";

const RAID_TYPES = ["심연의재련: 루드라", "침식의 정화소"];

function formatDateWithDay(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}/${day}(${days[date.getDay()]})`;
}

function formatTime(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function isPastRaid(raid) {
  const raidDateTime = new Date(`${raid.raid_date}T${raid.start_time}`);
  return raidDateTime < new Date(Date.now() - 4 * 60 * 60 * 1000);
}

function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getRaidStatusOrder(raid, myAppliedRaidIds) {
  const isFull =
    Number(raid.current_members) >= Number(raid.max_members);
  const isMyApplied = myAppliedRaidIds.has(String(raid.id));

  if (isMyApplied) return 1;
  if (!isFull) return 0;
  return 2;
}

function LobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { raids, loading, refetchRaids } = useRaids();
  const { myApplications } = useMyApplications(user);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = RAID_TYPES.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : RAID_TYPES[0];
  const [sortOrder, setSortOrder] = useState("time");
  const [selectedRaid, setSelectedRaid] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRaids, setHistoryRaids] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [togglingRaidId, setTogglingRaidId] = useState(null);
  const [deletingRaidId, setDeletingRaidId] = useState(null);
  const [selectedHistoryRaid, setSelectedHistoryRaid] = useState(null);

  const myAppliedRaidIds = useMemo(
    () => new Set(myApplications.map((a) => String(a.raid_id))),
    [myApplications]
  );

  const tabCounts = useMemo(() => {
    const counts = {};
    for (const type of RAID_TYPES) {
      counts[type] = raids.filter((r) => r.title === type && !isPastRaid(r)).length;
    }
    return counts;
  }, [raids]);

  const summary = useMemo(() => {
    const activeRaids = raids.filter((r) => !isPastRaid(r));
    return {
      total: activeRaids.length,
      appliedCount: activeRaids.filter((r) => myAppliedRaidIds.has(String(r.id))).length,
    };
  }, [raids, myAppliedRaidIds]);

  const filteredRaids = useMemo(() => {
    const filtered = raids.filter((r) => r.title === activeTab && !isPastRaid(r));

    return [...filtered].sort((a, b) => {
      if (sortOrder === "status") {
        const orderA = getRaidStatusOrder(a, myAppliedRaidIds);
        const orderB = getRaidStatusOrder(b, myAppliedRaidIds);
        if (orderA !== orderB) return orderA - orderB;
      }
      const dateA = new Date(`${a.raid_date}T${a.start_time}`).getTime();
      const dateB = new Date(`${b.raid_date}T${b.start_time}`).getTime();
      return dateA - dateB;
    });
  }, [raids, activeTab, sortOrder, myAppliedRaidIds]);

  const fetchHistory = async () => {
    if (historyRaids.length > 0) return;
    setHistoryLoading(true);

    // 90일 이내 공대 중 시작 시간이 4시간 이상 지난 것을 히스토리로 표시
    const ninetyDaysAgo = getLocalDateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    const { data, error } = await supabase
      .from("raids")
      .select("id, title, raid_date, start_time, description, max_members, created_by")
      .gte("raid_date", ninetyDaysAgo)
      .order("raid_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (!error) {
      const pastRaids = (data || []).filter(isPastRaid);
      setHistoryRaids(pastRaids);
    }
    setHistoryLoading(false);
  };

  const handleHistoryToggle = () => {
    if (!historyOpen) fetchHistory();
    setHistoryOpen((prev) => !prev);
  };

  const handleToggleComplete = async (raid) => {
    try {
      setTogglingRaidId(raid.id);
      const { error } = await supabase
        .from("raids")
        .update({ is_completed: !raid.is_completed })
        .eq("id", raid.id);
      if (error) {
        toast.error("완료 상태 변경에 실패했습니다.");
        return;
      }
      toast.success(raid.is_completed ? "공격대가 활성화되었습니다." : "공격대가 완료 처리되었습니다.");
      refetchRaids();
    } finally {
      setTogglingRaidId(null);
    }
  };

  const handleDelete = async (raid) => {
    if (!user || raid.created_by !== user.id) return;
    const confirmed = window.confirm(
      `정말 "${raid.title}" 공격대를 삭제하시겠습니까?\n\n이 작업을 수행하면 해당 공격대의 신청 정보도 함께 삭제됩니다.`
    );
    if (!confirmed) return;
    try {
      setDeletingRaidId(raid.id);
      const { error: appError } = await supabase
        .from("raid_applications")
        .delete()
        .eq("raid_id", raid.id);
      if (appError) {
        toast.error("신청 정보 삭제에 실패했습니다.");
        return;
      }
      const { error: raidError } = await supabase
        .from("raids")
        .delete()
        .eq("id", raid.id)
        .eq("created_by", user.id);
      if (raidError) {
        toast.error("공격대 삭제에 실패했습니다.");
        return;
      }
      toast.success("공격대와 신청 정보가 삭제되었습니다.");
      refetchRaids();
    } finally {
      setDeletingRaidId(null);
    }
  };

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
              <button
                type="button"
                className="lobby-create-link"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + 공격대 생성
              </button>
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
                onClick={() => setSearchParams({ tab: type })}
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
                  <button
                    type="button"
                    className="lobby-create-link"
                    style={{ display: "inline-flex", marginTop: 12 }}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    + 공격대 생성
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredRaids.map((raid) => (
              <LobbyCard
                key={raid.id}
                raid={raid}
                user={user}
                isMyApplied={myAppliedRaidIds.has(String(raid.id))}
                onClick={(r) => setSelectedRaid(r)}
                onEdit={(r) => navigate(`/raids/${r.id}/edit`)}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                isToggling={togglingRaidId === raid.id}
                isDeleting={deletingRaidId === raid.id}
              />
            ))
          )}
        </div>

        {/* 지난 공대 히스토리 */}
        <div className="lobby-history">
          <button
            type="button"
            className="lobby-history-toggle"
            onClick={handleHistoryToggle}
          >
            지난 공대 {historyOpen ? "▲" : "▼"}
          </button>
          {historyOpen && (
            <div className="lobby-history-list">
              {historyLoading ? (
                <div className="lobby-history-empty">불러오는 중...</div>
              ) : historyRaids.length === 0 ? (
                <div className="lobby-history-empty">완료된 공격대가 없습니다.</div>
              ) : (
                historyRaids.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="lobby-history-item"
                    onClick={() => setSelectedHistoryRaid(r)}
                  >
                    <div className="lobby-history-item-left">
                      <span className="lobby-history-item-title">{r.title}</span>
                      {r.description && r.description.trim() && (
                        <span className="lobby-history-item-desc">{r.description.trim()}</span>
                      )}
                    </div>
                    <span className="lobby-history-item-meta">
                      {formatDateWithDay(r.raid_date)} {formatTime(r.start_time)}
                    </span>
                  </button>
                ))
              )}
            </div>
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

      {selectedHistoryRaid && (
        <RaidModal
          raid={selectedHistoryRaid}
          onClose={() => setSelectedHistoryRaid(null)}
          onApplied={() => {}}
        />
      )}

      <RaidCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refetchRaids}
      />
    </Layout>
  );
}

export default LobbyPage;
