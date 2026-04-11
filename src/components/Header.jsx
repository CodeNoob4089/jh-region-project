import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

function Header({ user, onSidebarOpen, isSidebarOpen }) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const nickname =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    "디스코드유저";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      console.error("디스코드 로그인 에러:", error.message);
      toast.error("디스코드 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("로그아웃 실패");
      return;
    }

    toast.success("로그아웃되었습니다.");
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <button
            type="button"
            className={`app-header-sidebar-toggle ${isSidebarOpen ? "is-hidden" : ""}`}
            onClick={onSidebarOpen}
            aria-label="사이드바 열기"
          >
            ☰
          </button>

          <Link
            to="/"
            className="app-logo"
            aria-label="홈으로 이동"
          >
            <img src={logo} alt="JH 로고" className="app-logo-image" />
          </Link>
        </div>

        <div className="app-header-right">
          {user ? (
            <div className="app-profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="app-profile-trigger"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-label="프로필 메뉴 열기"
                title={nickname}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={nickname}
                    className="app-user-avatar"
                  />
                ) : (
                  <div className="app-user-avatar app-user-avatar-fallback">
                    {nickname.slice(0, 1)}
                  </div>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="app-profile-dropdown">
                  <button
                    type="button"
                    className="app-profile-dropdown-button"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="app-auth-button app-auth-button-discord"
              onClick={handleDiscordLogin}
            >
              <span className="app-auth-discord-icon">◉</span>
              Discord 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;