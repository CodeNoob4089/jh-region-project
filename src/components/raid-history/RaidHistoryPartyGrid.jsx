import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/raidHistoryHelpers";

function RaidHistoryPartyGrid({ parties }) {
  return (
    <section className="raid-history-detail-section">
      <div className="raid-history-detail-section-head">
        <h2 className="raid-history-detail-section-title">파티 구성</h2>
      </div>

      <div className="raid-history-detail-party-grid">
        {parties.map((party, index) => (
          <div key={index} className="raid-history-detail-party">
            <div className="raid-history-detail-party-top">
              <div className="raid-history-detail-party-title">
                {party.name || `${index + 1}파티`}
              </div>

              <div className="raid-history-detail-party-sub">
                평균 전투력{" "}
                <span className={getPowerTierClass(party.averagePower || 0)}>
                  {formatPowerK(party.averagePower || 0)}
                </span>
              </div>
            </div>

            {!party.hasRequiredSupport && (
              <div className="raid-history-detail-party-warning">
                치유성 또는 호법성이 필요했던 파티입니다.
              </div>
            )}

            <div className="raid-history-detail-slot-list">
              {party.slots.map((member, slotIndex) => (
                <div key={slotIndex} className="raid-history-detail-slot">
                  {member ? (
                    <>
                      <div className="raid-history-detail-slot-top">
                        <div className="raid-history-detail-slot-name">
                          {member.name}
                        </div>

                        <span
                          className={`raid-history-detail-slot-power ${getPowerTierClass(
                            member.power
                          )}`}
                        >
                          {formatPowerK(member.power)}
                        </span>
                      </div>

                      <div className="raid-history-detail-slot-sub">
                        <span
                          className={`raid-history-detail-job-pill ${
                            JOB_STYLE_MAP[member.job] || ""
                          }`}
                        >
                          {member.job}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="raid-history-detail-slot-empty">빈자리</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RaidHistoryPartyGrid;