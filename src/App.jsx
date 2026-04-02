import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage";
import RaidsPage from "./pages/RaidsPage";
import AdminRaidCreatePage from "./pages/AdminRaidCreatePage";
import AdminRaidsPage from "./pages/AdminRaidsPage";
import AdminRaidEditPage from "./pages/AdminRaidEditPage";
import AdminRaidDetailPage from "./pages/AdminRaidDetailPage";
import RaidHistoryPage from "./pages/RaidHistoryPage";
import RaidHistoryDetailPage from "./pages/RaidHistoryDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/raids" element={<RaidsPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/raids/new" element={<AdminRaidCreatePage />} />
      <Route path="/admin/raids" element={<AdminRaidsPage />} />
      <Route path="/admin/raids/history" element={<RaidHistoryPage />} />
      <Route path="/admin/raids/history/:raidId" element={<RaidHistoryDetailPage />} />
      <Route path="/admin/raids/:raidId/edit" element={<AdminRaidEditPage />} />
      <Route path="/admin/raids/:raidId" element={<AdminRaidDetailPage />} />
    </Routes>
  );
}

export default App;