import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function useMyApplications(user) {
  const [myApplications, setMyApplications] = useState([]);

  const fetchMyApplications = async () => {
    if (!user) {
      setMyApplications([]);
      return;
    }

    const { data, error } = await supabase
      .from("raid_applications")
      .select(`
        id,
        raid_id,
        user_id,
        character_id,
        status,
        created_at,
        raid:raids (
          id,
          title,
          raid_date,
          start_time,
          max_members
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("내 신청 목록 불러오기 실패:", error.message);
      setMyApplications([]);
    } else {
      setMyApplications(data || []);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [user]);

  return {
    myApplications,
    refetchMyApplications: fetchMyApplications,
  };
}

export default useMyApplications;