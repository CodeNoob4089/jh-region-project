import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuthContext } from "../context/AuthContext";

function Layout({ children }) {
  const { user } = useAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <Header user={user} />

      <button
        type="button"
        className={`app-floating-sidebar-toggle ${
          isSidebarOpen ? "is-hidden" : ""
        }`}
        onClick={handleOpenSidebar}
        aria-label="사이드바 열기"
      >
        ☰
      </button>

      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      <main className="app-main">
        <div className="app-main-inner">{children}</div>
      </main>
    </div>
  );
}

export default Layout;