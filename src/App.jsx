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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/raids" element={<RaidsPage />} />

      <Route path="/raids/new" element={<AdminRaidCreatePage />} />
      <Route path="/raids/manage" element={<AdminRaidsPage />} />
      <Route path="/raids/:raidId/edit" element={<AdminRaidEditPage />} />
      <Route path="/raids/:raidId" element={<AdminRaidDetailPage />} />

      <Route path="/raids/history" element={<RaidHistoryPage />} />
      <Route
        path="/raids/history/:raidId"
        element={<RaidHistoryDetailPage />}
      />
    </Routes>
  );
}

export default App;