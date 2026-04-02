import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import RaidHistoryListCard from "../components/raid-history/RaidHistoryListCard";
import "../styles/raid-history.css";

const TABS = ["심연의재련: 루드라", "침식의 정화소"];

function RaidHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(TABS[0]);
  const [historyRaids, setHistoryRaids] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("raids")
        .select(`
          id,
          title,
          raid_date,
          start_time,
          max_members,
          description,
          completed_at,
          raid_applications (
            id
          )
        `)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("지난 공격대 정보 불러오기 실패:", error.message);
        setHistoryRaids([]);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((raid) => ({
        ...raid,
        current_members: raid.raid_applications?.length || 0,
      }));

      setHistoryRaids(mapped);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredRaids = useMemo(() => {
    return historyRaids.filter((raid) => raid.title === selectedTab);
  }, [historyRaids, selectedTab]);

  return (
    <Layout>
      <div className="raid-history-page">
        <section className="raid-history-hero">
          <div className="raid-history-hero-left">
            <div className="raid-history-kicker">RAID HISTORY</div>
            <h1 className="raid-history-title">지난 공격대 정보</h1>
            <p className="raid-history-subtitle">
              완료 처리된 공격대를 탭별로 확인하고 상세 기록을 볼 수 있습니다.
            </p>
          </div>

          <div className="raid-history-hero-right">
            <div className="raid-history-summary-card">
              <div className="raid-history-summary-label">전체 완료 기록</div>
              <div className="raid-history-summary-value">
                {historyRaids.length}건
              </div>
            </div>
          </div>
        </section>

        <div className="raid-history-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`raid-history-tab ${
                selectedTab === tab ? "is-active" : ""
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="raid-history-loading">불러오는 중...</div>
        ) : filteredRaids.length === 0 ? (
          <div className="raid-history-empty">지난 공격대 정보가 없습니다.</div>
        ) : (
          <div className="raid-history-list">
            {filteredRaids.map((raid) => (
              <RaidHistoryListCard
                key={raid.id}
                raid={raid}
                onClick={() => navigate(`/admin/raids/history/${raid.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default RaidHistoryPage;