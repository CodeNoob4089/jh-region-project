import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Sidebar({ user, isOpen, onClose }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAdminStatus = async () => {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("관리자 여부 확인 실패:", error.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data?.is_admin);
    };

    fetchAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <>
      <div
        className={`app-sidebar-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={onClose}
      />

      <aside className={`app-floating-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="app-floating-sidebar-inner">
          <div className="app-sidebar-section">
            <div className="app-sidebar-title">메뉴</div>

            <nav className="app-sidebar-nav">
<NavLink
  to="/"
  end
  state={{ refreshHome: Date.now() }}
  className={({ isActive }) =>
    `app-sidebar-link ${isActive ? "is-active" : ""}`
  }
  onClick={onClose}
>
  홈
</NavLink>

              <NavLink
                to="/raids"
                className={({ isActive }) =>
                  `app-sidebar-link ${isActive ? "is-active" : ""}`
                }
                onClick={onClose}
              >
                공격대 목록
              </NavLink>

              {user && (
                <NavLink
                  to="/mypage"
                  className={({ isActive }) =>
                    `app-sidebar-link ${isActive ? "is-active" : ""}`
                  }
                  onClick={onClose}
                >
                  마이페이지
                </NavLink>
              )}
            </nav>
          </div>

{isAdmin && (
  <div className="app-sidebar-section">
    <div className="app-sidebar-title">관리자</div>

    <nav className="app-sidebar-nav">
      <NavLink
        to="/admin/dashboard"
        className={({ isActive }) =>
          `app-sidebar-link ${isActive ? "is-active" : ""}`
        }
        onClick={onClose}
      >
        관리자 대시보드
      </NavLink>

      <NavLink
        to="/admin/raids/new"
        className={({ isActive }) =>
          `app-sidebar-link ${isActive ? "is-active" : ""}`
        }
        onClick={onClose}
      >
        공격대 생성
      </NavLink>

      <NavLink
        to="/admin/raids"
        className={({ isActive }) =>
          `app-sidebar-link ${isActive ? "is-active" : ""}`
        }
        onClick={onClose}
      >
        공격대 관리
      </NavLink>

      <NavLink
        to="/admin/raids/history"
        className={({ isActive }) =>
          `app-sidebar-link ${isActive ? "is-active" : ""}`
        }
        onClick={onClose}
      >
        지난 공격대 정보
      </NavLink>
    </nav>
  </div>
)}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;