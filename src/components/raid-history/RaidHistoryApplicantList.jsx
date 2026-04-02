import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/raidHistoryHelpers";

function RaidHistoryApplicantList({ applications }) {
  return (
    <section className="raid-history-detail-section">
      <div className="raid-history-detail-section-head">
        <h2 className="raid-history-detail-section-title">신청자 목록</h2>
        <div className="raid-history-detail-section-count">
          총 {applications.length}명
        </div>
      </div>

      <div className="raid-history-detail-list">
        {applications.length === 0 ? (
          <div className="raid-history-detail-empty">신청자가 없습니다.</div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="raid-history-detail-item">
              <div className="raid-history-detail-item-top">
                <div className="raid-history-detail-name">
                  {app.character?.name || "-"}
                </div>

                <span
                  className={`raid-history-detail-power ${getPowerTierClass(
                    app.character?.power
                  )}`}
                >
                  {formatPowerK(app.character?.power)}
                </span>
              </div>

              <div className="raid-history-detail-sub">
                <span
                  className={`raid-history-detail-job-pill ${
                    JOB_STYLE_MAP[app.character?.job] || ""
                  }`}
                >
                  {app.character?.job || "-"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default RaidHistoryApplicantList;