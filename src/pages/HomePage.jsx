import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import Layout from "../layout/Layout";
import useRaids from "../hooks/useRaids";
import RaidModal from "../components/raid/RaidModal";
import { useAuthContext } from "../context/AuthContext";
import useMyApplications from "../hooks/useMyApplications";
import "../styles/home-raid-slider.css";

const RAID_TITLE_ORDER = ["심연의재련: 루드라", "침식의 정화소"];

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

function getRaidDateTimeValue(raid) {
  if (!raid?.raid_date) return Number.MAX_SAFE_INTEGER;

  const time = raid.start_time || "00:00:00";
  return new Date(`${raid.raid_date}T${time}`).getTime();
}

function getShortDescription(description) {
  const trimmed = String(description || "").trim();

  if (!trimmed) {
    return "설명이 아직 등록되지 않았습니다.";
  }

  return trimmed;
}

function HomePage() {
  const { user } = useAuthContext();
  const location = useLocation();
  const { raids, loading, refetchRaids } = useRaids();
  const { myApplications } = useMyApplications(user);
  const [selectedRaid, setSelectedRaid] = useState(null);

  const groupedRaids = useMemo(() => {
    const grouped = {
      "심연의재련: 루드라": [],
      "침식의 정화소": [],
    };

    for (const raid of raids) {
      if (!grouped[raid.title]) {
        grouped[raid.title] = [];
      }

      grouped[raid.title].push(raid);
    }

    Object.keys(grouped).forEach((title) => {
      grouped[title].sort(
        (a, b) => getRaidDateTimeValue(a) - getRaidDateTimeValue(b)
      );
    });

    return grouped;
  }, [raids]);

  const myAppliedRaidIds = useMemo(() => {
    return new Set(
      myApplications.map((application) => String(application.raid_id))
    );
  }, [myApplications]);

  const summary = useMemo(() => {
    const appliedCount = raids.filter((raid) =>
      myAppliedRaidIds.has(String(raid.id))
    ).length;

    return {
      total: raids.length,
      appliedCount,
    };
  }, [raids, myAppliedRaidIds]);

  useEffect(() => {
    if (!location.state?.refreshHome) return;

    setSelectedRaid(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    refetchRaids?.();
  }, [location.state, refetchRaids]);

  const handleRaidClick = (raid, isDisabled) => {
    if (isDisabled) {
      return;
    }

    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    setSelectedRaid(raid);
  };

  if (loading) {
    return (
      <Layout>
        <div className="raid-page">
          <div className="raid-loading-card">레이드 불러오는 중.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="raid-page">
        <section className="raid-home-hero">
          <div className="raid-home-hero-left">
            <div className="raid-home-kicker">RAID BOARD</div>
            <h1 className="raid-home-title align-left">공격대 모집 현황</h1>

            <div className="raid-home-hero-chips">
              <div className="raid-home-chip">전체 레이드 {summary.total}개</div>
            </div>
          </div>

          <div className="raid-home-hero-right">
            <div className="raid-home-summary-card">
              <div className="raid-home-summary-label">내 신청</div>
              <div className="raid-home-summary-value">
                {summary.appliedCount}
              </div>
            </div>
          </div>
        </section>

        <div className="raid-container">
          {RAID_TITLE_ORDER.map((title) => {
            const sectionRaids = groupedRaids[title] || [];

            return (
              <section key={title} className="raid-section">
                <div className="raid-section-head">
                  <div>
                    <div className="raid-section-overline">RAID CATEGORY</div>
                    <div className="raid-section-label">{title}</div>
                  </div>
                </div>

                {sectionRaids.length === 0 ? (
                  <div className="raid-time-grid">
                    <div className="raid-loading-card">등록된 레이드가 없습니다.</div>
                  </div>
                ) : (
                  <div className="raid-slider-wrap">
                    <Swiper
                      modules={[Autoplay]}
                      spaceBetween={16}
                      slidesPerView={3}
                      grabCursor={true}
                      loop={sectionRaids.length > 3}
                      autoplay={
                        sectionRaids.length > 1
                          ? {
                              delay: 5200,
                              disableOnInteraction: false,
                              pauseOnMouseEnter: true,
                            }
                          : false
                      }
                      speed={900}
                      className="raid-home-swiper"
                    >
                      {sectionRaids.map((raid) => {
                        const isMyApplied = myAppliedRaidIds.has(String(raid.id));
                        const isFull =
                          Number(raid.current_members) >= Number(raid.max_members);
                        const isDisabled = isFull && !isMyApplied;

                        return (
                          <SwiperSlide
                            key={raid.id}
                            className="raid-home-swiper-slide"
                          >
                            <button
                              type="button"
                              className={`raid-time-card ${
                                isMyApplied ? "raid-time-card-applied" : ""
                              } ${isDisabled ? "raid-time-card-disabled" : ""}`}
                              onClick={() => handleRaidClick(raid, isDisabled)}
                              disabled={isDisabled}
                            >
                              <div className="raid-time-card-accent" />

                              <div className="raid-time-card-top">
                                <div className="raid-time-card-date">
                                  {formatDateWithDay(raid.raid_date)}
                                </div>

                                {isMyApplied ? (
                                  <div className="raid-time-card-badge">신청완료</div>
                                ) : isDisabled ? (
                                  <div className="raid-time-card-badge is-closed">
                                    마감
                                  </div>
                                ) : (
                                  <div className="raid-time-card-badge is-open">
                                    참여 가능
                                  </div>
                                )}
                              </div>

                              <div className="raid-time-card-time">
                                {formatTime(raid.start_time)}
                              </div>

                              <div className="raid-time-card-description-box">
                                <div className="raid-time-card-description-label">
                                  RAID INFO
                                </div>

                                <div className="raid-time-card-description">
                                  {getShortDescription(raid.description)}
                                </div>
                              </div>

                              <div className="raid-time-card-members">
                                <span className="raid-time-card-members-label">
                                  인원
                                </span>
                                <span className="raid-time-card-count">
                                  {raid.current_members}/{raid.max_members}
                                </span>
                              </div>

                              <div className="raid-time-card-footer">
                                {isDisabled ? (
                                  <div className="raid-time-card-status">정원 마감</div>
                                ) : raid.needsSupport ? (
                                  <div className="raid-time-card-warning">
                                    지원 필요
                                  </div>
                                ) : raid.isUnbalanced ? (
                                  <div className="raid-time-card-info">
                                    파티 균형 주의
                                  </div>
                                ) : (
                                  <div className="raid-time-card-stable">
                                    균형 안정
                                  </div>
                                )}

                                <div className="raid-time-card-arrow">→</div>
                              </div>
                            </button>
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {selectedRaid && (
        <RaidModal
          raid={selectedRaid}
          onClose={() => setSelectedRaid(null)}
          onApplied={refetchRaids}
        />
      )}
    </Layout>
  );
}

export default HomePage;