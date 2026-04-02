import { useState } from "react";
import { supabase } from "../lib/supabase";

const JOB_OPTIONS = [
  "검성",
  "수호성",
  "살성",
  "궁성",
  "마도성",
  "정령성",
  "호법성",
  "치유성",
];

function CharacterSetupModal({ user, open, onClose, onComplete }) {
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [power, setPower] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("캐릭터명을 입력해주세요.");
      return;
    }

    if (!job) {
      alert("직업을 선택해주세요.");
      return;
    }

    if (!power || Number(power) <= 0) {
      alert("전투력을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const { error: characterError } = await supabase.from("characters").insert({
      user_id: user.id,
      name: name.trim(),
      job,
      power: Number(power),
      is_main: true,
    });

    if (characterError) {
      console.error("캐릭터 생성 에러:", characterError.message);
      alert(characterError.message);
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("온보딩 완료 처리 에러:", profileError.message);
      alert(profileError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onComplete();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "24px",
          borderRadius: "16px",
        }}
      >
        <h2>첫 캐릭터 등록</h2>
        <p>처음 로그인했어요. 먼저 본캐릭터를 등록해주세요.</p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="text"
            placeholder="캐릭터명"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">직업 선택</option>
            {JOB_OPTIONS.map((jobOption) => (
              <option key={jobOption} value={jobOption}>
                {jobOption}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="전투력"
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "캐릭터 등록 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CharacterSetupModal;