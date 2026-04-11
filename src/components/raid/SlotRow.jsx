// Design Ref: §3.1 — SlotRow 컴포넌트, 1행 슬롯 레이아웃
import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/myPageHelpers";
import "../../styles/raid-modal-panel.css";

export function SlotRow({ member, isMe }) {
  if (!member) {
    return (
      <div className="slot-row empty">
        <span className="slot-row-empty">빈 자리</span>
      </div>
    );
  }

  return (
    <div className={`slot-row${isMe ? " slot-row--mine" : ""}`}>
      <span className={`raid-modal-job-pill ${JOB_STYLE_MAP[member.job] || ""}`}>
        {member.job}
      </span>
      <span className="slot-row-name">{member.name}</span>
      {isMe && <span className="slot-row-badge">나</span>}
      <span className={`slot-row-power ${getPowerTierClass(member.power)}`}>
        {formatPowerK(member.power)}
      </span>
    </div>
  );
}
