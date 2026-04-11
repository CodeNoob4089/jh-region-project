import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import "../styles/raid-form.css";

const RAID_TYPES = ["심연의재련: 루드라", "침식의 정화소"];

function LobbyCreatePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

  const [submitting, setSubmitting] = useState(false);
  const [raidType, setRaidType] = useState(RAID_TYPES[0]);
  const [roomName, setRoomName] = useState("");
  const [raidDate, setRaidDate] = useState(todayStr);
  const [selectedHour, setSelectedHour] = useState("20");
  const [selectedMinute, setSelectedMinute] = useState("00");

  const maxMembers = 8;

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );

  const minuteOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")),
    []
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/lobby");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!roomName.trim()) {
      toast.error("방 이름을 입력해주세요.");
      return;
    }

    if (!raidDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("raids").insert({
        title: raidType,
        description: roomName.trim(),
        raid_date: raidDate,
        start_time: `${selectedHour}:${selectedMinute}`,
        max_members: maxMembers,
        created_by: user.id,
      });

      if (error) {
        console.error("방 생성 실패:", error.message);
        toast.error("방 생성에 실패했습니다.");
        return;
      }

      toast.success("방이 생성되었습니다.");
      navigate("/lobby");
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

  if (!user) return null;

  return (
    <Layout>
      <div className="raid-form-page">
        <div className="raid-form-header">
          <h1 className="raid-form-title">방 만들기</h1>
          <p className="raid-form-subtitle">
            레이드 종류와 출발 시간을 설정하고 공대원을 모집하세요.
          </p>
        </div>

        <form className="raid-form-card" onSubmit={handleSubmit}>
          {/* 레이드 종류 */}
          <div className="raid-form-group">
            <label className="raid-form-label">레이드 종류</label>
            <select
              className="raid-form-input"
              value={raidType}
              onChange={(e) => setRaidType(e.target.value)}
            >
              {RAID_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 방 이름 */}
          <div className="raid-form-group">
            <label className="raid-form-label">방 이름</label>
            <input
              type="text"
              className="raid-form-input"
              placeholder="예: 300K+ 4딜 모집, 트라이엇 환영"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={60}
            />
          </div>

          {/* 날짜 + 시간 */}
          <div className="raid-form-row raid-form-row-double">
            <div className="raid-form-group">
              <label className="raid-form-label">출발 날짜</label>
              <input
                type="date"
                className="raid-form-input"
                value={raidDate}
                onChange={(e) => setRaidDate(e.target.value)}
              />
            </div>

            <div className="raid-form-group raid-form-time-group">
              <label className="raid-form-label">출발 시간</label>
              <div className="raid-form-time-grid">
                <select
                  className="raid-form-input"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>

                <select
                  className="raid-form-input"
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                >
                  {minuteOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}분
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 최대 인원 (고정) */}
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

          <div className="raid-form-actions">
            <button
              type="button"
              className="raid-form-button raid-form-button-secondary"
              onClick={() => navigate("/lobby")}
            >
              취소
            </button>

            <button
              type="submit"
              className="raid-form-button raid-form-button-primary"
              disabled={submitting}
            >
              {submitting ? "생성 중..." : "방 만들기"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default LobbyCreatePage;
