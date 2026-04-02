import { useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../context/AuthContext";
import useMyCharacters from "../../hooks/useMyCharacters";
import useRaidApplications from "../../hooks/useRaidApplications";
import useMyApplications from "../../hooks/useMyApplications";
import { buildRaidParties } from "../../utils/buildRaidParties";
import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/myPageHelpers";
import "../../styles/raid.css";

function formatDateWithDay(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[date.getDay()];

  return `${month}/${day} (${dayName})`;
}

function RaidModal({ raid, onClose, onApplied }) {
  const { user } = useAuthContext();
  const { characters } = useMyCharacters(user);
  const { applications, refetchApplications } = useRaidApplications(raid?.id);
  const { myApplications, refetchMyApplications } = useMyApplications(user);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!raid) return null;

  const parties = buildRaidParties(applications);

  const myApplication = applications.find(
    (application) => String(application.user_id) === String(user?.id)
  );

  const myCharacterId = myApplication ? String(myApplication.character_id) : null;

  const myCharacter = characters.find(
    (character) => String(character.id) === String(myCharacterId)
  );

  const handleApply = async (character) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const alreadyAppliedSameRaid = applications.some(
      (application) => String(application.character_id) === String(character.id)
    );

    if (alreadyAppliedSameRaid) {
      toast.error("이미 이 공격대에 신청한 캐릭터입니다.");
      return;
    }

    const hasSameTimeApplication = myApplications.some((application) => {
      return (
        application.raid?.raid_date === raid.raid_date &&
        application.raid?.start_time === raid.start_time
      );
    });

    if (hasSameTimeApplication) {
      toast.error("같은 시간대에는 하나의 공격대만 신청할 수 있습니다.");
      return;
    }

    if (applications.length >= raid.max_members) {
      toast.error("정원이 가득 찼습니다.");
      return;
    }

    try {
      const { error } = await supabase.from("raid_applications").insert([
        {
          raid_id: raid.id,
          user_id: user.id,
          character_id: character.id,
          status: "pending",
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("공격대 신청이 완료되었습니다.");

      await refetchApplications();
      await refetchMyApplications();

      if (onApplied) {
        await onApplied();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("공격대 신청 실패:", error.message);
      toast.error("공격대 신청 중 오류가 발생했습니다.");
    }
  };

  const handleCancelApplication = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!myApplication) {
      toast.error("취소할 신청 정보가 없습니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("raid_applications")
        .delete()
        .eq("id", myApplication.id);

      if (error) {
        throw error;
      }

      toast.success("공격대 신청이 취소되었습니다.");

      await refetchApplications();
      await refetchMyApplications();

      if (onApplied) {
        await onApplied();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("공격대 신청 취소 실패:", error.message);
      toast.error("공격대 신청 취소 중 오류가 발생했습니다.");
    }
  };

  return createPortal(
    <div className="raid-modal-overlay" onClick={onClose}>
      <div className="raid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="raid-modal-header">
          <div className="raid-modal-header-left">
            <div className="raid-modal-kicker">RAID BOARD</div>
            <h2 className="raid-modal-title">{raid.title}</h2>
            <p className="raid-modal-meta">
              {formatDateWithDay(raid.raid_date)} / {raid.start_time}
            </p>
            <p className="raid-modal-meta">
              인원: {applications.length} / {raid.max_members}
            </p>
          </div>

          <button
            type="button"
            className="raid-modal-close-button"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {myApplication && myCharacter && (
          <div className="raid-modal-summary">
            <span className="raid-modal-summary-label">현재 신청 캐릭터</span>

            <div className="raid-modal-summary-main">
              <span className="raid-modal-summary-name">{myCharacter.name}</span>

              <span
                className={`raid-modal-job-pill ${JOB_STYLE_MAP[myCharacter.job] || ""}`}
              >
                {myCharacter.job}
              </span>

              <span
                className={`raid-modal-summary-power ${getPowerTierClass(
                  myCharacter.power
                )}`}
              >
                {formatPowerK(myCharacter.power)}
              </span>
            </div>
          </div>
        )}

        <div className="raid-modal-party-grid">
          {parties.map((party) => (
            <div key={party.name} className="raid-modal-party-box">
              <div className="raid-modal-party-head">
                <div className="raid-modal-party-title">{party.name}</div>

                <div className="raid-modal-party-average">
                  평균 전투력{" "}
                  <span className={getPowerTierClass(party.averagePower || 0)}>
                    {formatPowerK(party.averagePower || 0)}
                  </span>
                </div>
              </div>

              {!party.hasRequiredSupport && (
                <div className="raid-modal-party-warning">
                  치유성 또는 호법성이 필요합니다.
                </div>
              )}

              <div className="raid-modal-slot-list">
                {party.slots.map((member, index) => {
                  const isMyCharacter =
                    member &&
                    myCharacterId &&
                    String(member.id) === String(myCharacterId);

                  return (
                    <div
                      key={index}
                      className={`raid-modal-slot ${member ? "" : "empty"} ${
                        isMyCharacter ? "raid-modal-slot-my-character" : ""
                      }`}
                    >
                      {member ? (
                        <>
                          <div className="raid-modal-slot-header">
                            <div className="raid-modal-slot-name">{member.name}</div>
                          </div>

                          <div className="raid-modal-slot-meta-row">
                            {isMyCharacter && (
                              <span className="raid-modal-slot-badge">
                                내 캐릭터
                              </span>
                            )}

                            <span
                              className={`raid-modal-job-pill ${
                                JOB_STYLE_MAP[member.job] || ""
                              }`}
                            >
                              {member.job}
                            </span>
                          </div>

                          <div className="raid-modal-slot-power-box">
                            <div className="raid-modal-slot-power-label">
                              전투력
                            </div>

                            <div
                              className={`raid-modal-slot-power ${getPowerTierClass(
                                member.power
                              )}`}
                            >
                              {formatPowerK(member.power)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="raid-modal-slot-empty-text">빈 자리</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="raid-modal-apply-section">
          <h3 className="raid-modal-apply-title">내 캐릭터로 신청</h3>

          {myApplication ? (
            <div className="raid-modal-my-application-box">
              <p className="raid-modal-no-characters raid-modal-my-application-text">
                이미 신청한 상태입니다.
              </p>

              <button
                type="button"
                className="raid-modal-character-button raid-modal-cancel-button"
                onClick={handleCancelApplication}
              >
                신청 취소
              </button>
            </div>
          ) : characters.length === 0 ? (
            <p className="raid-modal-no-characters">등록된 캐릭터가 없습니다.</p>
          ) : (
            <div className="raid-modal-character-buttons">
              {characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className="raid-modal-character-button"
                  onClick={() => handleApply(character)}
                >
                  <div className="raid-modal-character-card-top">
                    <div className="raid-modal-character-card-left">
                      <div className="raid-modal-character-button-name">
                        {character.name}
                      </div>

                      <div className="raid-modal-character-button-tags">
                        <span
                          className={`raid-modal-job-pill ${
                            JOB_STYLE_MAP[character.job] || ""
                          }`}
                        >
                          {character.job}
                        </span>

                        {character.is_main && (
                          <span className="raid-modal-character-button-badge">
                            대표
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="raid-modal-character-card-right">
                      <div className="raid-modal-character-button-power-label">
                        전투력
                      </div>

                      <div
                        className={`raid-modal-character-button-power ${getPowerTierClass(
                          character.power
                        )}`}
                      >
                        {formatPowerK(character.power)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RaidModal;