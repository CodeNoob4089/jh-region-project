import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { buildRaidParties } from "../utils/buildRaidParties";
import RaidHistoryDetailHero from "../components/raid-history/RaidHistoryDetailHero";
import RaidHistoryApplicantList from "../components/raid-history/RaidHistoryApplicantList";
import RaidHistoryPartyGrid from "../components/raid-history/RaidHistoryPartyGrid";
import "../styles/raid-history-detail.css";

function RaidHistoryDetailPage() {
  const { raidId } = useParams();
  const navigate = useNavigate();

  const [raid, setRaid] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      setLoading(true);

      const { data: raidData, error: raidError } = await supabase
        .from("raids")
        .select(`
          id,
          title,
          raid_date,
          start_time,
          max_members,
          description,
          completed_at,
          is_completed
        `)
        .eq("id", raidId)
        .single();

      if (raidError || !raidData?.is_completed) {
        console.error("지난 공격대 상세 불러오기 실패:", raidError?.message);
        setRaid(null);
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data: appData, error: appError } = await supabase
        .from("raid_applications")
        .select(`
          id,
          user_id,
          character_id,
          status,
          character:characters (
            id,
            name,
            job,
            power
          )
        `)
        .eq("raid_id", raidId);

      if (appError) {
        console.error("지난 공격대 신청 정보 불러오기 실패:", appError.message);
        setApplications([]);
      } else {
        setApplications(appData || []);
      }

      setRaid(raidData);
      setLoading(false);
    };

    fetchHistoryDetail();
  }, [raidId]);

  const parties = useMemo(() => buildRaidParties(applications), [applications]);

  if (loading) {
    return (
      <Layout>
        <div className="raid-history-detail-page">
          <div className="raid-history-detail-loading">불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  if (!raid) {
    return (
      <Layout>
        <div className="raid-history-detail-page">
          <div className="raid-history-detail-empty">
            지난 공격대 정보를 찾을 수 없습니다.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="raid-history-detail-page">
        <RaidHistoryDetailHero
          raid={raid}
          applicationsCount={applications.length}
          onBack={() => navigate("/admin/raids/history")}
        />

        {String(raid.description || "").trim() !== "" && (
          <div className="raid-history-detail-description-card">
            <div className="raid-history-detail-description-label">설명</div>
            <div className="raid-history-detail-description">
              {raid.description}
            </div>
          </div>
        )}

        <div className="raid-history-detail-grid">
          <RaidHistoryApplicantList applications={applications} />
          <RaidHistoryPartyGrid parties={parties} />
        </div>
      </div>
    </Layout>
  );
}

export default RaidHistoryDetailPage;