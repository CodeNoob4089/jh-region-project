import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { buildRaidParties } from "../utils/buildRaidParties";
import { useAuthContext } from "../context/AuthContext";
import useMyApplications from "../hooks/useMyApplications";
import useMyCharacters from "../hooks/useMyCharacters";

function formatTime(timeString) {
  if (!timeString) return "";

  const parts = timeString.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function formatDateWithDay(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[date.getDay()];

  return `${month}/${day} (${dayName})`;
}

function RaidDetailPage() {
  const { raidId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const { myApplications, refetchMyApplications } = useMyApplications(user);
  const { characters, refetchCharacters } = useMyCharacters(user);

  const [raid, setRaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRaid = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("raids")
      .select(`
        *,
        raid_applications (
          id,
          user_id,
          character_id,
          status,
          character:characters (
            id,
            name,
            job,
            power
          )
        )
      `)
      .eq("id", raidId)
      .single();

    if (error) {
      console.error("레이드 상세 불러오기 실패:", error.message);
      toast.error("레이드 정보를 불러오지 못했습니다.");
      setRaid(null);
      setLoading(false);
      return;
    }

    const applications = data.raid_applications || [];
    const parties = buildRaidParties(applications);

    const needsSupport = parties.some((party) => !party.hasRequiredSupport);
    const powerGap = Math.abs(
      (parties[0]?.averagePower || 0) - (parties[1]?.averagePower || 0)
    );

    setRaid({
      ...data,
      current_members: applications.length,
      parties,
      needsSupport,
      powerGap,
      isUnbalanced: powerGap >= 3000,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchRaid();
  }, [raidId]);

  useEffect(() => {
    if (!raidId) return;

    const channel = supabase
      .channel(`raid-detail-${raidId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "raid_applications",
        },
        () => {
          fetchRaid();
          if (user) {
            refetchMyApplications?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [raidId, user]);

  const myApplication = useMemo(() => {
    return myApplications.find(
      (application) => String(application.raid_id) === String(raidId)
    );
  }, [myApplications, raidId]);

  const myAppliedCharacterId = myApplication?.character_id
    ? String(myApplication.character_id)
    : null;

  const isFull =
    Number(raid?.current_members || 0) >= Number(raid?.max_members || 0);

  const canApply = !!user && !myApplication && !isFull;

  const handleApply = async (character) => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    if (!raid) return;

    if (myApplication) {
      toast.error("이미 이 레이드에 신청한 캐릭터가 있습니다.");
      return;
    }

    if (isFull) {
      toast.error("정원이 마감되었습니다.");
      return;
    }

    const hasSameCharacterApplication = myApplications.some(
      (application) => String(application.character_id) === String(character.id)
    );

    if (hasSameCharacterApplication) {
      toast.error("같은 캐릭터로 이미 다른 레이드에 신청되어 있습니다.");
      return;
    }

    const hasSameTimeApplication = myApplications.some((application) => {
      return (
        application.raid?.raid_date === raid.raid_date &&
        application.raid?.start_time === raid.start_time
      );
    });

    if (hasSameTimeApplication) {
      toast.error("같은 시간대 레이드에는 중복 신청할 수 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("raid_applications").insert({
        raid_id: raid.id,
        user_id: user.id,
        character_id: character.id,
        status: "applied",
      });

      if (error) {
        console.error("레이드 신청 실패:", error.message);
        toast.error("레이드 신청에 실패했습니다.");
        return;
      }

      toast.success("레이드 신청이 완료되었습니다.");
      await fetchRaid();
      await refetchMyApplications?.();
      await refetchCharacters?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!myApplication) {
      toast.error("취소할 신청 정보가 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("raid_applications")
        .delete()
        .eq("id", myApplication.id);

      if (error) {
        console.error("레이드 신청 취소 실패:", error.message);
        toast.error("레이드 신청 취소에 실패했습니다.");
        return;
      }

      toast.success("레이드 신청이 취소되었습니다.");
      await fetchRaid();
      await refetchMyApplications?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="raid-detail-page">
          <div className="raid-detail-loading">레이드 정보를 불러오는 중.</div>
        </div>
      </Layout>
    );
  }

  if (!raid) {
    return (
      <Layout>
        <div className="raid-detail-page">
          <div className="raid-detail-empty">
            <div className="raid-detail-empty-title">
              레이드를 찾을 수 없습니다.
            </div>

            <button
              type="button"
              className="raid-detail-back-button"
              onClick={() => navigate("/")}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="raid-detail-page">
        <div className="raid-detail-container">
          <div className="raid-detail-top">
            <div>
              <div className="raid-detail-breadcrumb">
                <Link to="/" className="raid-detail-breadcrumb-link">
                  홈
                </Link>
                <span className="raid-detail-breadcrumb-separator">/</span>
                <span>{raid.title}</span>
              </div>

              <h1 className="raid-detail-title">{raid.title}</h1>

              <div className="raid-detail-meta">
                {formatDateWithDay(raid.raid_date)} · {formatTime(raid.start_time)} ·{" "}
                {raid.current_members}/{raid.max_members}명
              </div>
            </div>

            <button
              type="button"
              className="raid-detail-back-button"
              onClick={() => navigate("/")}
            >
              뒤로가기
            </button>
          </div>

          {raid.description && (
            <div className="raid-detail-description">
              {raid.description}
            </div>
          )}

          <div className="raid-detail-status-row">
            {myApplication && (
              <div className="raid-detail-status-badge is-primary">
                신청 완료
              </div>
            )}

            {isFull && (
              <div className="raid-detail-status-badge is-gray">
                정원 마감
              </div>
            )}

            {raid.needsSupport && (
              <div className="raid-detail-status-badge is-red">
                지원 필요
              </div>
            )}

            {!raid.needsSupport && raid.isUnbalanced && (
              <div className="raid-detail-status-badge is-yellow">
                파티 균형 주의
              </div>
            )}
          </div>

          <div className="raid-detail-party-grid">
            {raid.parties.map((party, index) => (
              <div key={index} className="raid-detail-party-box">
                <div className="raid-detail-party-title">{index + 1}파티</div>

                <div className="raid-detail-party-average">
                  평균 전투력: {party.averagePower.toLocaleString()}
                </div>

                {!party.hasRequiredSupport && (
                  <div className="raid-detail-party-warning">
                    지원 필요 (치유성 / 호법성 없음)
                  </div>
                )}

                <div className="raid-detail-slot-list">
                  {party.members.map((member, memberIndex) => {
                    const isMyCharacter =
                      myAppliedCharacterId &&
                      String(member.character_id) === myAppliedCharacterId;

                    return (
                      <div
                        key={`${index}-${memberIndex}`}
                        className={`raid-detail-slot ${
                          isMyCharacter ? "is-my-character" : ""
                        }`}
                      >
                        {isMyCharacter && (
                          <div className="raid-detail-slot-badge">내 캐릭터</div>
                        )}

                        <div className="raid-detail-slot-name">
                          {member.character?.name || "-"}
                        </div>
                        <div className="raid-detail-slot-job">
                          직업: {member.character?.job || "-"}
                        </div>
                        <div className="raid-detail-slot-power">
                          전투력: {(member.character?.power || 0).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({ length: 4 - party.members.length }).map((_, emptyIndex) => (
                    <div
                      key={`empty-${index}-${emptyIndex}`}
                      className="raid-detail-slot is-empty"
                    >
                      빈 자리
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="raid-detail-apply-section">
            <div className="raid-detail-apply-title">신청 관리</div>

            {!user && (
              <div className="raid-detail-help-text">
                로그인 후 캐릭터를 선택해서 신청할 수 있습니다.
              </div>
            )}

            {user && myApplication && (
              <div className="raid-detail-my-application-box">
                <div className="raid-detail-my-application-text">
                  현재 이 레이드에 신청되어 있습니다.
                </div>

                <button
                  type="button"
                  className="raid-detail-cancel-button"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  신청 취소
                </button>
              </div>
            )}

            {user && !myApplication && (
              <>
                {characters.length === 0 ? (
                  <div className="raid-detail-help-text">
                    먼저 마이페이지에서 캐릭터를 등록해주세요.
                  </div>
                ) : isFull ? (
                  <div className="raid-detail-help-text">
                    현재 정원이 마감되어 신청할 수 없습니다.
                  </div>
                ) : (
                  <div className="raid-detail-character-buttons">
                    {characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        className="raid-detail-character-button"
                        onClick={() => handleApply(character)}
                        disabled={!canApply || submitting}
                      >
                        {character.name} · {character.job} ·{" "}
                        {Number(character.power || 0).toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default RaidDetailPage;