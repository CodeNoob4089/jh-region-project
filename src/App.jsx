import { Routes, Route } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import MyPage from "./pages/MyPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
}

export default App;
