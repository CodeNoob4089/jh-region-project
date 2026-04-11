import { NavLink } from "react-router-dom";

function Sidebar({ user, isOpen, onClose }) {
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
                className={({ isActive }) =>
                  `app-sidebar-link ${isActive ? "is-active" : ""}`
                }
                onClick={onClose}
              >
                레이드공대 로비
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

          {user && (
            <div className="app-sidebar-section">
              <div className="app-sidebar-title">공격대</div>

              <nav className="app-sidebar-nav">
                <NavLink
                  to="/lobby/new"
                  className={({ isActive }) =>
                    `app-sidebar-link ${isActive ? "is-active" : ""}`
                  }
                  onClick={onClose}
                >
                  방 만들기
                </NavLink>

                <NavLink
                  to="/raids/new"
                  className={({ isActive }) =>
                    `app-sidebar-link ${isActive ? "is-active" : ""}`
                  }
                  onClick={onClose}
                >
                  공격대 생성 (관리자)
                </NavLink>

                <NavLink
                  to="/raids/manage"
                  className={({ isActive }) =>
                    `app-sidebar-link ${isActive ? "is-active" : ""}`
                  }
                  onClick={onClose}
                >
                  공격대 관리
                </NavLink>

                <NavLink
                  to="/raids/history"
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