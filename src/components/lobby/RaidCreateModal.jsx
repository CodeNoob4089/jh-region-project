import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../context/AuthContext";

function RaidCreateModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuthContext();

  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [raidDate, setRaidDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("22");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [description, setDescription] = useState("");

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")),
    []
  );

  const handleClose = () => {
    setTitle("");
    setRaidDate("");
    setSelectedHour("22");
    setSelectedMinute("00");
    setDescription("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) { toast.error("로그인이 필요합니다."); return; }
    if (!title.trim()) { toast.error("공격대 제목을 선택해주세요."); return; }
    if (!raidDate) { toast.error("날짜를 선택해주세요."); return; }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("raids").insert({
        title: title.trim(),
        raid_date: raidDate,
        start_time: `${selectedHour}:${selectedMinute}`,
        max_members: 8,
        description: description.trim(),
        created_by: user.id,
      });

      if (error) {
        console.error("공격대 생성 실패:", error.message);
        toast.error("공격대 생성에 실패했습니다.");
        return;
      }

      toast.success("공격대가 생성되었습니다.");
      handleClose();
      if (onCreated) onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="rcm-overlay" onClick={handleClose}>
      <div className="rcm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rcm-header">
          <h2 className="rcm-title">공격대 생성</h2>
          <button type="button" className="rcm-close" onClick={handleClose}>닫기</button>
        </div>

        <form onSubmit={handleSubmit} className="rcm-form">
          <div className="rcm-group">
            <label className="rcm-label">공격대 제목</label>
            <select
              className="rcm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option value="심연의재련: 루드라">심연의재련: 루드라</option>
              <option value="침식의 정화소">침식의 정화소</option>
            </select>
          </div>

          <div className="rcm-row">
            <div className="rcm-group">
              <label className="rcm-label">날짜</label>
              <input
                type="date"
                className="rcm-input"
                value={raidDate}
                onChange={(e) => setRaidDate(e.target.value)}
              />
            </div>

            <div className="rcm-group">
              <label className="rcm-label">시작 시간</label>
              <div className="rcm-time-row">
                <select
                  className="rcm-input"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>{h}시</option>
                  ))}
                </select>
                <select
                  className="rcm-input"
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                >
                  {minuteOptions.map((m) => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rcm-group">
            <label className="rcm-label">설명 (선택)</label>
            <textarea
              className="rcm-textarea"
              rows={4}
              placeholder="예: 힐러 1명 필수 / 디스코드 음성 참여 필수"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rcm-actions">
            <button
              type="button"
              className="rcm-btn rcm-btn-cancel"
              onClick={handleClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="rcm-btn rcm-btn-submit"
              disabled={submitting}
            >
              {submitting ? "생성 중..." : "공격대 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default RaidCreateModal;
