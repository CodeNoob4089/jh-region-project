import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";

function AdminRaidCreatePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

const { error } = await supabase.from("raids").insert({
  title: title.trim(),
  raid_date: raidDate,
  start_time: startTime,
  max_members: Number(maxMembers),
  description: description.trim(),
  created_by: user.id,
});

      if (error) {
        console.error("공격대 생성 실패:", error.message);
        toast.error("공격대 생성에 실패했습니다.");
        return;
      }

      toast.success("공격대가 생성되었습니다.");
      navigate("/raids");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingAdmin) {
    return (
      <Layout>
        <div className="admin-page">
          <div className="admin-page-loading">관리자 권한 확인 중.</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">공격대 생성</h1>
          <p className="admin-page-subtitle">
            새로운 공격대를 만들고 설명까지 함께 등록할 수 있습니다.
          </p>
        </div>

        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">공격대 제목</label>
            <select
              className="admin-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option value="심연의재련: 루드라">심연의재련: 루드라</option>
              <option value="침식의 정화소">침식의 정화소</option>
            </select>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">날짜</label>
              <input
                type="date"
                className="admin-form-input"
                value={raidDate}
                onChange={(e) => setRaidDate(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">시작 시간</label>
              <input
                type="time"
                className="admin-form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">최대 인원</label>
            <input
              type="number"
              min="1"
              max="24"
              className="admin-form-input"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">설명</label>
            <textarea
              className="admin-form-textarea"
              rows="5"
              placeholder="예: 힐러 1명 필수 / 디스코드 음성 참여 필수 / 늦참 불가"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => navigate("/raids")}
            >
              취소
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={submitting}
            >
              {submitting ? "생성 중..." : "공격대 생성"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default AdminRaidCreatePage;