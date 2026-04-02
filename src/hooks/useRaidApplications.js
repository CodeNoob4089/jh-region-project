import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function useRaidApplications(raidId) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    if (!raidId) {
      setApplications([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("raid_applications")
      .select(`
        id,
        raid_id,
        user_id,
        character_id,
        status,
        created_at,
        character:characters (
          id,
          name,
          job,
          power
        )
      `)
      .eq("raid_id", raidId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("공격대 신청 목록 불러오기 실패:", error.message);
      setApplications([]);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [raidId]);

  return {
    applications,
    loading,
    refetchApplications: fetchApplications,
  };
}

export default useRaidApplications;