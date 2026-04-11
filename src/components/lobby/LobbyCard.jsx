import { JOB_STYLE_MAP } from "../../utils/myPageHelpers";


const JOB_ABBR = {
  검성: "검",
  수호성: "수호",
  살성: "살",
  궁성: "궁",
  마도성: "마도",
  정령성: "정령",
  호법성: "호법",
  치유성: "치유",
};

function formatDateWithDay(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}/${day}(${days[date.getDay()]})`;
}

function formatTime(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function LobbyCard({
  raid,
  user,
  isMyApplied,
  onClick,
  onEdit,
  onToggleComplete,
  onDelete,
  isToggling,
  isDeleting,
}) {
  const isFull =
    Number(raid.current_members) >= Number(raid.max_members);
  const isDisabled = isFull && !isMyApplied;
  const isOwner = user && raid.created_by === user.id;

  const parties = raid.parties || [];

  const btnVariant = isMyApplied
    ? "is-applied"
    : isFull
    ? "is-full"
    : "is-open";

  const btnLabel = isMyApplied ? "신청완료" : isFull ? "마감" : "참가 신청";

  const cardClass = [
    "lobby-card",
    isMyApplied ? "is-applied" : "",
    isFull && !isMyApplied ? "is-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (isDisabled) return;
    onClick(raid);
  };

  return (
    <div className={cardClass} onClick={handleClick} role="button" tabIndex={isDisabled ? -1 : 0}>
      {/* 방 이름 + 시간 + 인원 */}
      <div className="lobby-card-info">
        <div className="lobby-card-name">
          {raid.description || "방 이름 없음"}
        </div>

        <div className="lobby-card-meta">
          <span className="lobby-card-time">
            {formatDateWithDay(raid.raid_date)} {formatTime(raid.start_time)}
          </span>
          {raid.hostCharacter && (
            <>
              <span className="lobby-card-meta-sep">·</span>
              <span className="lobby-card-host-name">{raid.hostCharacter.name}</span>
            </>
          )}
          <span className="lobby-card-meta-sep">·</span>
          <span className={`lobby-card-count ${isFull ? "is-full" : ""}`}>
            {raid.current_members}/{raid.max_members}명
          </span>
        </div>
      </div>

      {/* 신청 버튼 */}
      <div className="lobby-card-action">
        <button
          type="button"
          className={`lobby-apply-btn ${btnVariant}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isDisabled}
        >
          {btnLabel}
        </button>
      </div>

      {/* 파티 슬롯 인라인 — 1파티 | 2파티 한 줄 */}
      <div className="lobby-card-parties">
        {parties.map((party, partyIndex) => (
          <>
            {partyIndex > 0 && (
              <div key={`divider-${partyIndex}`} className="lobby-party-divider" />
            )}
            <div key={party.name} className="lobby-party-row">
              <span className="lobby-party-label">{party.name}</span>
              <div className="lobby-party-slots">
                {party.slots.map((member, index) => {
                  const jobClass = member
                    ? JOB_STYLE_MAP[member.job] || ""
                    : "is-empty";
                  return (
                    <div
                      key={index}
                      className={`lobby-slot ${jobClass}`}
                      title={member ? `${member.name} (${member.job})` : "빈 자리"}
                    >
                      {member ? (JOB_ABBR[member.job] || member.job[0]) : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ))}
      </div>

      {/* 공대장 전용 관리 버튼 */}
      {isOwner && (
        <div className="lobby-card-mgmt" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="lobby-card-mgmt-btn lobby-card-mgmt-edit"
            onClick={() => onEdit(raid)}
          >
            수정
          </button>
          <button
            type="button"
            className={`lobby-card-mgmt-btn lobby-card-mgmt-complete${raid.is_completed ? " is-completed" : ""}`}
            onClick={() => onToggleComplete(raid)}
            disabled={isToggling}
          >
            {isToggling ? "변경 중..." : raid.is_completed ? "활성화" : "완료 처리"}
          </button>
          <button
            type="button"
            className="lobby-card-mgmt-btn lobby-card-mgmt-delete"
            onClick={() => onDelete(raid)}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}

export default LobbyCard;
