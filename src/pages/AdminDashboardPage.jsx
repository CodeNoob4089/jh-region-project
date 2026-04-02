import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import "../styles/admin-dashboard.css";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState([]);
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error("로그인이 필요합니다.");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("관리자 권한 확인 실패:", error.message);
        toast.error("권한 확인 중 오류가 발생했습니다.");
        navigate("/");
        return;
      }

      if (!data?.is_admin) {
        toast.error("관리자만 접근할 수 있습니다.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!isAdmin) return;

      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nickname");

      const { data: characterData, error: characterError } = await supabase
        .from("characters")
        .select("id, user_id, name, job, power")
        .order("power", { ascending: false });

      if (profileError) {
        console.error("프로필 불러오기 실패:", profileError.message);
        setProfiles([]);
      } else {
        setProfiles(profileData || []);
      }

      if (characterError) {
        console.error("캐릭터 불러오기 실패:", characterError.message);
        setCharacters([]);
      } else {
        setCharacters(characterData || []);
      }

      setLoading(false);
    };

    fetchDashboard();
  }, [isAdmin]);

  const jobDistribution = useMemo(() => {
    const counts = {};

    for (const character of characters) {
      const job = character.job || "미지정";
      counts[job] = (counts[job] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([job, count]) => ({ job, count }))
      .sort((a, b) => b.count - a.count);
  }, [characters]);

  const topCharacters = useMemo(() => {
    return [...characters].slice(0, 10);
  }, [characters]);

  if (authLoading || checkingAdmin) {
    return (
      <Layout>
        <div className="admin-dashboard-page">
          <div className="admin-dashboard-loading">관리자 권한 확인 중.</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">레기온 대시보드</h1>
          <p className="admin-dashboard-subtitle">
            공격대와 별개로 전체 인원과 직업 분포를 확인할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="admin-dashboard-loading">불러오는 중...</div>
        ) : (
          <>
            <div className="admin-dashboard-summary-grid">
              <div className="admin-dashboard-summary-card">
                <div className="admin-dashboard-summary-label">전체 유저 수</div>
                <div className="admin-dashboard-summary-value">
                  {profiles.length}
                </div>
              </div>

              <div className="admin-dashboard-summary-card">
                <div className="admin-dashboard-summary-label">전체 캐릭터 수</div>
                <div className="admin-dashboard-summary-value">
                  {characters.length}
                </div>
              </div>

              <div className="admin-dashboard-summary-card">
                <div className="admin-dashboard-summary-label">직업 종류 수</div>
                <div className="admin-dashboard-summary-value">
                  {jobDistribution.length}
                </div>
              </div>
            </div>

            <div className="admin-dashboard-section">
              <h2 className="admin-dashboard-section-title">직업별 분포</h2>

              <div className="admin-dashboard-job-grid">
                {jobDistribution.map((item) => (
                  <div key={item.job} className="admin-dashboard-job-card">
                    <div className="admin-dashboard-job-name">{item.job}</div>
                    <div className="admin-dashboard-job-count">{item.count}명</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-dashboard-section">
              <h2 className="admin-dashboard-section-title">전투력 상위 캐릭터</h2>

              <div className="admin-dashboard-ranking-list">
                {topCharacters.map((character, index) => (
                  <div key={character.id} className="admin-dashboard-ranking-item">
                    <div className="admin-dashboard-ranking-left">
                      <div className="admin-dashboard-ranking-rank">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="admin-dashboard-ranking-name">
                          {character.name}
                        </div>
                        <div className="admin-dashboard-ranking-sub">
                          {character.job}
                        </div>
                      </div>
                    </div>

                    <div className="admin-dashboard-ranking-power">
                      {Number(character.power || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default AdminDashboardPage;