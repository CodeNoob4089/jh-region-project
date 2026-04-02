import {
  formatDateTime,
  formatDateWithDay,
  formatTime,
} from "../../utils/raidHistoryHelpers";

function RaidHistoryListCard({ raid, onClick }) {
  return (
    <button
      type="button"
      className="raid-history-card"
      onClick={onClick}
    >
      <div className="raid-history-card-accent" />

      <div className="raid-history-card-top">
        <div className="raid-history-card-title-wrap">
          <div className="raid-history-card-kicker">COMPLETED RAID</div>
          <div className="raid-history-card-title">{raid.title}</div>
          <div className="raid-history-card-meta">
            {formatDateWithDay(raid.raid_date)} · {formatTime(raid.start_time)}
          </div>
        </div>

        <div className="raid-history-card-right">
          <div className="raid-history-card-count">
            {raid.current_members}/{raid.max_members}
          </div>
          <div className="raid-history-card-count-label">참여 인원</div>
        </div>
      </div>

      {String(raid.description || "").trim() !== "" && (
        <div className="raid-history-card-description">
          {raid.description}
        </div>
      )}

      <div className="raid-history-card-bottom">
        <div className="raid-history-card-completed">
          완료 시각 {formatDateTime(raid.completed_at)}
        </div>

        <div className="raid-history-card-link">
          상세 보기
          <span className="raid-history-card-link-arrow">→</span>
        </div>
      </div>
    </button>
  );
}

export default RaidHistoryListCard;