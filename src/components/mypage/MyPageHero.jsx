import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/myPageHelpers";

function MyPageHero({ user, mainCharacter, characterCount }) {
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    "레기온원";

  return (
    <section className="my-hero-card">
      <div className="my-hero-left">
        <div className="my-hero-avatar-frame">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="my-hero-avatar"
            />
          ) : (
            <div className="my-hero-avatar my-hero-avatar-fallback">
              {displayName.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="my-hero-copy">
          <div className="my-hero-overline">JH LEGION PROFILE</div>
          <h1 className="my-hero-title">마이페이지</h1>
          <div className="my-hero-subtitle">잔향 레기온 캐릭터 전투 정보</div>

          <div className="my-hero-chips">
            <div className="my-chip is-online">
              <span className="my-chip-light" />
              계정 연동
            </div>

            <div className="my-chip">보유 캐릭터 {characterCount}명</div>
          </div>
        </div>
      </div>

      <div className="my-hero-right">
        <div className="my-stat-card main">
          <div className="my-stat-label">대표 캐릭터</div>

          {mainCharacter ? (
            <>
              <div className="my-stat-value">{mainCharacter.name}</div>
              <div className="my-stat-sub">
                <span
                  className={`my-job-pill ${
                    JOB_STYLE_MAP[mainCharacter.job] || ""
                  }`}
                >
                  {mainCharacter.job}
                </span>
                <span className="my-stat-divider">·</span>
                <span
                  className={`my-stat-power ${getPowerTierClass(
                    mainCharacter.power
                  )}`}
                >
                  {formatPowerK(mainCharacter.power)}
                </span>
              </div>
            </>
          ) : (
            <div className="my-stat-sub">등록된 캐릭터 없음</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MyPageHero;