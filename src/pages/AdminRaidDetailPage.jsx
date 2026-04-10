import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import { buildRaidParties } from "../utils/buildRaidParties";
import "../styles/raid-detail.css";

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

function AdminRaidDetailPage() {
  const { raidId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [raid, setRaid] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [deletingRaid, setDeletingRaid] = useState(false);
  const [completingRaid, setCompletingRaid] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    const { data: raidData, error: raidError } = await supabase
      .from("raids")
      .select(`
        id,
        title,
        raid_date,
        start_time,
        max_members,
        description,
        is_completed,
        completed_at,
        created_by
      `)
      .eq("id", raidId)
      .single();

    if (raidError) {
      console.error("공격대 정보 불러오기 실패:", raidError.message);
      toast.error("공격대 정보를 불러오지 못했습니다.");
      navigate("/raids/manage");
      return;
    }

    const { data: appData, error: appError } = await supabase
      .from("raid_applications")
      .select(`
        id,
        user_id,
        character_id,
        status,
        character:characters (
          id,
          name,
          job,
          power
        )
      `)
      .eq("raid_id", raidId);

    if (appError) {
      console.error("신청 정보 불러오기 실패:", appError.message);
      toast.error("신청 정보를 불러오지 못했습니다.");
      setApplications([]);
    } else {
      setApplications(appData || []);
    }

    setRaid(raidData);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/");
      return;
    }

    fetchData();
  }, [user, authLoading, raidId, navigate]);

  const isOwner = raid?.created_by === user?.id;

  const handleCancel = async (applicationId) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!isOwner) {
      toast.error("본인이 만든 공격대에서만 신청 취소를 관리할 수 있습니다.");
      return;
    }

    const ok = window.confirm("이 신청을 취소하시겠습니까?");
    if (!ok) return;

    try {
      setCancelingId(applicationId);

      const { error } = await supabase
        .from("raid_applications")
        .delete()
        .eq("id", applicationId);

      if (error) {
        console.error("신청 취소 실패:", error.message);
        toast.error("신청 취소에 실패했습니다.");
        return;
      }

      toast.success("신청이 취소되었습니다.");
      await fetchData();
    } finally {
      setCancelingId(null);
    }
  };

  const handleDeleteRaid = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!isOwner) {
      toast.error("본인이 만든 공격대만 삭제할 수 있습니다.");
      return;
    }

    const ok = window.confirm(
      `정말 "${raid.title}" 공격대를 삭제하시겠습니까?\n\n이 작업을 수행하면 현재 신청 정보도 함께 삭제됩니다.`
    );
    if (!ok) return;

    try {
      setDeletingRaid(true);

      const { error: applicationsDeleteError } = await supabase
        .from("raid_applications")
        .delete()
        .eq("raid_id", raid.id);

      if (applicationsDeleteError) {
        console.error("신청 정보 삭제 실패:", applicationsDeleteError.message);
        toast.error("신청 정보 삭제에 실패했습니다.");
        return;
      }

      const { error: raidDeleteError } = await supabase
        .from("raids")
        .delete()
        .eq("id", raid.id)
        .eq("created_by", user.id);

      if (raidDeleteError) {
        console.error("공격대 삭제 실패:", raidDeleteError.message);
        toast.error("공격대 삭제에 실패했습니다.");
        return;
      }

      toast.success("공격대와 신청 정보가 삭제되었습니다.");
      navigate("/raids/manage");
    } finally {
      setDeletingRaid(false);
    }
  };

  const handleCompleteRaid = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!isOwner) {
      toast.error("본인이 만든 공격대만 완료 처리할 수 있습니다.");
      return;
    }

    const ok = window.confirm(
      `정말 "${raid.title}" 공격대를 완료 처리하시겠습니까?\n\n완료된 공격대는 '지난 공격대 정보' 탭으로 이동됩니다.`
    );
    if (!ok) return;

    try {
      setCompletingRaid(true);

      const { error } = await supabase
        .from("raids")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", raid.id)
        .eq("created_by", user.id);

      if (error) {
        console.error("공격대 완료 처리 실패:", error.message);
        toast.error("공격대 완료 처리에 실패했습니다.");
        return;
      }

      toast.success("공격대가 완료 처리되었습니다.");
      navigate("/raids/history");
    } finally {
      setCompletingRaid(false);
    }
  };

  const parties = useMemo(() => buildRaidParties(applications), [applications]);

  const partyWarnings = useMemo(() => {
    const warnings = [];

    if (parties.some((party) => !party.hasRequiredSupport)) {
      warnings.push("지원 필요");
    }

    if (applications.length < (raid?.max_members || 0)) {
      warnings.push("정원 미달");
    }

    return { warnings };
  }, [parties, applications.length, raid?.max_members]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="admin-raid-detail-page">
          <div className="admin-raid-detail-loading">불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !raid) {
    return null;
  }

  return (
    <Layout>
      <div className="admin-raid-detail-page">
        <div className="admin-raid-detail-header">
          <div>
            <h1 className="admin-raid-detail-title">{raid.title}</h1>

            <div className="admin-raid-detail-info">
              <div>{formatDateWithDay(raid.raid_date)}</div>
              <div>{formatTime(raid.start_time)}</div>
              <div>
                {applications.length}/{raid.max_members}
              </div>
            </div>
          </div>

          <div className="admin-raid-detail-header-actions">
            <button
              type="button"
              className="admin-raid-detail-back-button"
              onClick={() => navigate("/raids/manage")}
            >
              목록으로
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  className="admin-raid-detail-complete-button"
                  onClick={handleCompleteRaid}
                  disabled={completingRaid}
                >
                  {completingRaid ? "완료 처리 중..." : "공격대 완료"}
                </button>

                <button
                  type="button"
                  className="admin-raid-detail-delete-button"
                  onClick={handleDeleteRaid}
                  disabled={deletingRaid}
                >
                  {deletingRaid ? "삭제 중..." : "공격대 삭제"}
                </button>
              </>
            )}
          </div>
        </div>

        {String(raid.description || "").trim() !== "" && (
          <div className="admin-raid-detail-desc">{raid.description}</div>
        )}

        <div className="admin-raid-status-panel">
          <div className="admin-raid-status-card">
            <div className="admin-raid-status-label">현재 인원</div>
            <div className="admin-raid-status-value">
              {applications.length}/{raid.max_members}
            </div>
          </div>

          <div className="admin-raid-status-card">
            <div className="admin-raid-status-label">상태 요약</div>
            <div className="admin-raid-status-badges">
              {partyWarnings.warnings.length === 0 ? (
                <span className="admin-raid-status-badge is-good">안정적</span>
              ) : (
                partyWarnings.warnings.map((warning) => (
                  <span
                    key={warning}
                    className={`admin-raid-status-badge ${
                      warning === "지원 필요"
                        ? "is-danger"
                        : warning === "파티 균형 주의"
                        ? "is-warning"
                        : "is-muted"
                    }`}
                  >
                    {warning}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <h2 className="admin-raid-detail-section-title">신청자 목록</h2>

        <div className="admin-raid-detail-list">
          {applications.length === 0 ? (
            <div className="admin-raid-detail-empty">현재 신청자가 없습니다.</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="admin-raid-detail-item">
                <div>
                  <div className="admin-raid-detail-name">
                    {app.character?.name || "-"}
                  </div>
                  <div className="admin-raid-detail-sub">
                    {app.character?.job || "-"} ·{" "}
                    {Number(app.character?.power || 0).toLocaleString()}
                  </div>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    className="admin-raid-detail-cancel"
                    onClick={() => handleCancel(app.id)}
                    disabled={cancelingId === app.id}
                  >
                    {cancelingId === app.id ? "취소 중..." : "신청 취소"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <h2 className="admin-raid-detail-section-title">파티 구성</h2>

        <div className="admin-raid-detail-party-grid">
          {parties.map((party, index) => (
            <div key={index} className="admin-raid-detail-party">
              <div className="admin-raid-detail-party-top">
                <div className="admin-raid-detail-party-title">
                  {party.name || `${index + 1}파티`}
                </div>

                <span
                  className={`admin-raid-detail-party-badge ${
                    party.hasRequiredSupport ? "is-good" : "is-danger"
                  }`}
                >
                  {party.hasRequiredSupport ? "지원 안정" : "지원 필요"}
                </span>
              </div>

              <div className="admin-raid-detail-party-sub">
                평균 전투력: {Number(party.averagePower || 0).toLocaleString()}
              </div>

              {!party.hasRequiredSupport && (
                <div className="admin-raid-detail-party-warning">
                  치유성 또는 호법성이 필요합니다.
                </div>
              )}

              <div className="admin-raid-detail-slot-list">
                {parties[index].slots.map((member, slotIndex) => (
                  <div
                    key={slotIndex}
                    className={`admin-raid-detail-slot ${
                      member && (member.job === "치유성" || member.job === "호법성")
                        ? "is-support"
                        : ""
                    }`}
                  >
                    {member ? (
                      <>
                        <div className="admin-raid-detail-slot-top">
                          <div className="admin-raid-detail-slot-name">
                            {member.name}
                          </div>

                          <span
                            className={`admin-raid-detail-slot-role ${
                              member.job === "치유성" || member.job === "호법성"
                                ? "is-support"
                                : "is-dealer"
                            }`}
                          >
                            {member.job}
                          </span>
                        </div>

                        <div className="admin-raid-detail-slot-sub">
                          전투력 {Number(member.power || 0).toLocaleString()}
                        </div>

                        {isOwner && (
                          <button
                            type="button"
                            className="admin-raid-detail-slot-cancel"
                            onClick={() => handleCancel(member.applicationId)}
                            disabled={cancelingId === member.applicationId}
                          >
                            {cancelingId === member.applicationId
                              ? "취소 중..."
                              : "신청 취소"}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="admin-raid-detail-slot-empty">빈자리</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default AdminRaidDetailPage;