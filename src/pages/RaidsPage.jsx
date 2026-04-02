import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import useRaids from "../hooks/useRaids";
import RaidModal from "../components/raid/RaidModal";
import { useAuthContext } from "../context/AuthContext";
import useMyApplications from "../hooks/useMyApplications";

function formatTime(timeString) {
  if (!timeString) return "";

  const parts = timeString.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function formatDateWithDay(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[date.getDay()];

  return `${month}/${day} (${dayName})`;
}

function RaidsPage() {
  const { user } = useAuthContext();
  const { raids, loading, refetchRaids } = useRaids();
  const { myApplications } = useMyApplications(user);
  const [selectedRaid, setSelectedRaid] = useState(null);

  const myAppliedRaidIds = useMemo(() => {
    return new Set(myApplications.map((application) => String(application.raid_id)));
  }, [myApplications]);

  const handleRaidClick = (raid, isDisabled) => {
    if (isDisabled) {
      return;
    }

    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    setSelectedRaid(raid);
  };

  if (loading) {
    return (
      <Layout>
        <div className="raids-page">
          <div className="raids-page-loading">공격대 목록 불러오는 중.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="raids-page">
        <div className="raids-page-header">
          <h1 className="raids-page-title">공격대 목록</h1>
          <p className="raids-page-subtitle">
            전체 공격대를 한 번에 확인하고 설명까지 볼 수 있습니다.
          </p>
        </div>

        <div className="raids-list">
          {raids.map((raid) => {
            const isMyApplied = myAppliedRaidIds.has(String(raid.id));
            const isFull = Number(raid.current_members) >= Number(raid.max_members);
            const isDisabled = isFull && !isMyApplied;

            return (
              <button
                key={raid.id}
                type="button"
                className={`raids-list-card ${
                  isMyApplied ? "is-applied" : ""
                } ${isDisabled ? "is-disabled" : ""}`}
                onClick={() => handleRaidClick(raid, isDisabled)}
                disabled={isDisabled}
              >
                <div className="raids-list-card-top">
                  <div>
                    <div className="raids-list-card-title">{raid.title}</div>
                    <div className="raids-list-card-meta">
                      {formatDateWithDay(raid.raid_date)} · {formatTime(raid.start_time)}
                    </div>
                  </div>

                  <div className="raids-list-card-count">
                    {raid.current_members}/{raid.max_members}
                  </div>
                </div>

                {raid.description && (
                  <div className="raids-list-card-description">
                    {raid.description}
                  </div>
                )}

                <div className="raids-list-card-status-row">
                  {isMyApplied && (
                    <div className="raids-list-badge is-primary">신청완료</div>
                  )}

                  {isDisabled && (
                    <div className="raids-list-badge is-gray">정원 마감</div>
                  )}

                  {!isDisabled && raid.needsSupport && (
                    <div className="raids-list-badge is-red">지원 필요</div>
                  )}

                  {!isDisabled && !raid.needsSupport && raid.isUnbalanced && (
                    <div className="raids-list-badge is-yellow">파티 균형 주의</div>
                  )}
                </div>
              </button>
            );
          })}
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

export default RaidsPage;