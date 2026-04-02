import {
  formatDateTime,
  formatDateWithDay,
  formatTime,
} from "../../utils/raidHistoryHelpers";

function RaidHistoryDetailHero({
  raid,
  applicationsCount,
  onBack,
}) {
  return (
    <section className="raid-history-detail-hero">
      <div className="raid-history-detail-hero-left">
        <div className="raid-history-detail-kicker">RAID HISTORY</div>
        <h1 className="raid-history-detail-title">{raid.title}</h1>

        <div className="raid-history-detail-meta">
          <div className="raid-history-detail-meta-chip">
            {formatDateWithDay(raid.raid_date)}
          </div>
          <div className="raid-history-detail-meta-chip">
            {formatTime(raid.start_time)}
          </div>
          <div className="raid-history-detail-meta-chip">
            인원 {applicationsCount}/{raid.max_members}
          </div>
          <div className="raid-history-detail-meta-chip is-completed">
            완료 시각 {formatDateTime(raid.completed_at)}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="raid-history-detail-back-button"
        onClick={onBack}
      >
        목록으로
      </button>
    </section>
  );
}

export default RaidHistoryDetailHero;