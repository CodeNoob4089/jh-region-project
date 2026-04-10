import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import "../styles/admin-raids.css";

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

function AdminRaidsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [raids, setRaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingRaidId, setDeletingRaidId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchRaids = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("raids")
      .select(`
        id,
        title,
        raid_date,
        start_time,
        max_members,
        description,
        created_by,
        raid_applications (
          id
        )
      `)
      .order("raid_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("공격대 목록 불러오기 실패:", error.message);
      toast.error("공격대 목록을 불러오지 못했습니다.");
      setRaids([]);
      setLoading(false);
      return;
    }

    const mappedRaids = (data || []).map((raid) => ({
      ...raid,
      current_members: raid.raid_applications?.length || 0,
    }));

    setRaids(mappedRaids);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchRaids();
  }, [user]);

  const handleDelete = async (raid) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (raid.created_by !== user.id) {
      toast.error("본인이 만든 공격대만 삭제할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(
      `정말 "${raid.title}" 공격대를 삭제하시겠습니까?\n\n` +
        "이 작업을 수행하면 해당 공격대의 신청 정보도 함께 삭제됩니다."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRaidId(raid.id);

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
      await fetchRaids();
    } finally {
      setDeletingRaidId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="admin-raids-page">
          <div className="admin-raids-loading">불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-raids-page">
        <div className="admin-raids-header">
          <div>
            <h1 className="admin-raids-title">공격대 관리</h1>
            <p className="admin-raids-subtitle">
              생성된 공격대를 확인하고, 내가 만든 공격대는 수정하거나 삭제할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="admin-raids-create-button"
            onClick={() => navigate("/admin/raids/new")}
          >
            공격대 생성
          </button>
        </div>

        {loading ? (
          <div className="admin-raids-loading">공격대 목록 불러오는 중.</div>
        ) : raids.length === 0 ? (
          <div className="admin-raids-empty">생성된 공격대가 없습니다.</div>
        ) : (
          <div className="admin-raids-list">
            {raids.map((raid) => {
              const isOwner = raid.created_by === user?.id;

              return (
                <div key={raid.id} className="admin-raids-card">
                  <div className="admin-raids-card-top">
                    <div>
                      <div className="admin-raids-card-title">{raid.title}</div>
                      <div className="admin-raids-card-meta">
                        {formatDateWithDay(raid.raid_date)} · {formatTime(raid.start_time)}
                      </div>
                    </div>

                    <div className="admin-raids-card-count">
                      {raid.current_members}/{raid.max_members}
                    </div>
                  </div>

                  {String(raid.description || "").trim() !== "" && (
                    <div className="admin-raids-card-description">
                      {raid.description}
                    </div>
                  )}

                  <div className="admin-raids-card-actions">
                    {isOwner && (
                      <button
                        type="button"
                        className="admin-raids-edit-button"
                        onClick={() => navigate(`/admin/raids/${raid.id}/edit`)}
                      >
                        수정
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-raids-detail-button"
                      onClick={() => navigate(`/admin/raids/${raid.id}`)}
                    >
                      상세
                    </button>

                    {isOwner && (
                      <button
                        type="button"
                        className="admin-raids-delete-button"
                        onClick={() => handleDelete(raid)}
                        disabled={deletingRaidId === raid.id}
                      >
                        {deletingRaidId === raid.id ? "삭제 중..." : "삭제"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminRaidsPage;