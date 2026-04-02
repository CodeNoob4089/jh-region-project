import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import "../styles/admin-raid-edit.css";

function AdminRaidEditPage() {
  const navigate = useNavigate();
  const { raidId } = useParams();
  const { user, loading: authLoading } = useAuthContext();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRaid, setLoadingRaid] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [raidDate, setRaidDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error("로그인이 필요합니다.");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("관리자 권한 확인 실패:", error.message);
        toast.error("권한 확인 중 오류가 발생했습니다.");
        navigate("/");
        return;
      }

      if (!data?.is_admin) {
        toast.error("관리자만 접근할 수 있습니다.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRaid = async () => {
      if (!isAdmin) return;

      setLoadingRaid(true);

      const { data, error } = await supabase
        .from("raids")
        .select("id, title, raid_date, start_time, max_members, description")
        .eq("id", raidId)
        .single();

      if (error) {
        console.error("공격대 정보 불러오기 실패:", error.message);
        toast.error("공격대 정보를 불러오지 못했습니다.");
        navigate("/admin/raids");
        return;
      }

      setTitle(data.title || "");
      setRaidDate(data.raid_date || "");
      setStartTime(data.start_time ? data.start_time.slice(0, 5) : "");
      setMaxMembers(data.max_members || 8);
      setDescription(data.description || "");
      setLoadingRaid(false);
    };

    fetchRaid();
  }, [isAdmin, raidId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("공격대 제목을 입력해주세요.");
      return;
    }

    if (!raidDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    if (!startTime) {
      toast.error("시간을 선택해주세요.");
      return;
    }

    if (!maxMembers || Number(maxMembers) <= 0) {
      toast.error("최대 인원을 올바르게 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("raids")
        .update({
          title: title.trim(),
          raid_date: raidDate,
          start_time: startTime,
          max_members: Number(maxMembers),
          description: description.trim(),
        })
        .eq("id", raidId);

      if (error) {
        console.error("공격대 수정 실패:", error.message);
        toast.error("공격대 수정에 실패했습니다.");
        return;
      }

      toast.success("공격대가 수정되었습니다.");
      navigate("/admin/raids");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingAdmin || loadingRaid) {
    return (
      <Layout>
        <div className="admin-raid-edit-page">
          <div className="admin-raid-edit-loading">공격대 정보 불러오는 중.</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="admin-raid-edit-page">
        <div className="admin-raid-edit-header">
          <h1 className="admin-raid-edit-title">공격대 수정</h1>
          <p className="admin-raid-edit-subtitle">
            기존 공격대 정보를 수정할 수 있습니다.
          </p>
        </div>

        <form className="admin-raid-edit-card" onSubmit={handleSubmit}>
          <div className="admin-raid-edit-group">
            <label className="admin-raid-edit-label">공격대 제목</label>
            <select
              className="admin-raid-edit-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option value="심연의재련: 루드라">심연의재련: 루드라</option>
              <option value="침식의 정화소">침식의 정화소</option>
            </select>
          </div>

          <div className="admin-raid-edit-row">
            <div className="admin-raid-edit-group">
              <label className="admin-raid-edit-label">날짜</label>
              <input
                type="date"
                className="admin-raid-edit-input"
                value={raidDate}
                onChange={(e) => setRaidDate(e.target.value)}
              />
            </div>

            <div className="admin-raid-edit-group">
              <label className="admin-raid-edit-label">시작 시간</label>
              <input
                type="time"
                className="admin-raid-edit-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-raid-edit-group">
            <label className="admin-raid-edit-label">최대 인원</label>
            <input
              type="number"
              min="1"
              max="24"
              className="admin-raid-edit-input"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
            />
          </div>

          <div className="admin-raid-edit-group">
            <label className="admin-raid-edit-label">설명</label>
            <textarea
              className="admin-raid-edit-textarea"
              rows="5"
              placeholder="예: 힐러 1명 필수 / 디스코드 음성 참여 필수 / 늦참 불가"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="admin-raid-edit-actions">
            <button
              type="button"
              className="admin-raid-edit-cancel"
              onClick={() => navigate("/admin/raids")}
            >
              취소
            </button>

            <button
              type="submit"
              className="admin-raid-edit-submit"
              disabled={submitting}
            >
              {submitting ? "저장 중..." : "수정 저장"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default AdminRaidEditPage;