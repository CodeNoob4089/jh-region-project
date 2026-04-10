import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import "../styles/raid-form.css";

function AdminRaidCreatePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [raidDate, setRaidDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [description, setDescription] = useState("");

  const maxMembers = 8;

  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, index) =>
      String(index).padStart(2, "0")
    );
  }, []);

  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 }, (_, index) =>
      String(index).padStart(2, "0")
    );
  }, []);

  const startTime = `${selectedHour}:${selectedMinute}`;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!title.trim()) {
      toast.error("공격대 제목을 입력해주세요.");
      return;
    }

    if (!raidDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    if (!selectedHour || !selectedMinute) {
      toast.error("시간을 선택해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("raids").insert({
        title: title.trim(),
        raid_date: raidDate,
        start_time: startTime,
        max_members: maxMembers,
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

  if (authLoading) {
    return (
      <Layout>
        <div className="raid-form-page">
          <div className="raid-form-loading">불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="raid-form-page">
        <div className="raid-form-header">
          <h1 className="raid-form-title">공격대 생성</h1>
          <p className="raid-form-subtitle">
            새로운 공격대를 만들고 설명까지 함께 등록할 수 있습니다.
          </p>
        </div>

        <form className="raid-form-card" onSubmit={handleSubmit}>
          <div className="raid-form-group">
            <label className="raid-form-label">공격대 제목</label>
            <select
              className="raid-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option value="심연의재련: 루드라">심연의재련: 루드라</option>
              <option value="침식의 정화소">침식의 정화소</option>
            </select>
          </div>

          <div className="raid-form-row raid-form-row-double">
            <div className="raid-form-group">
              <label className="raid-form-label">날짜</label>
              <input
                type="date"
                className="raid-form-input"
                value={raidDate}
                onChange={(e) => setRaidDate(e.target.value)}
              />
            </div>

<div className="raid-form-group raid-form-time-group">
  <label className="raid-form-label">시작 시간</label>
  <div className="raid-form-time-grid">
                <select
                  className="raid-form-input"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>

                <select
                  className="raid-form-input"
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}분
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="raid-form-group">
            <label className="raid-form-label">최대 인원</label>
            <input
              type="number"
              className="raid-form-input raid-form-input-disabled"
              value={maxMembers}
              disabled
              readOnly
            />
            <div className="raid-form-help-text">최대 인원은 8명으로 고정됩니다.</div>
          </div>

          <div className="raid-form-group">
            <label className="raid-form-label">설명</label>
            <textarea
              className="raid-form-textarea"
              rows="5"
              placeholder="예: 힐러 1명 필수 / 디스코드 음성 참여 필수 / 늦참 불가"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="raid-form-actions">
            <button
              type="button"
              className="raid-form-button raid-form-button-secondary"
              onClick={() => navigate("/raids")}
            >
              취소
            </button>

            <button
              type="submit"
              className="raid-form-button raid-form-button-primary"
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