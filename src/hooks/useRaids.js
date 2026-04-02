import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { buildRaidParties } from "../utils/buildRaidParties";

function useRaids() {
  const [raids, setRaids] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRaids = useCallback(async () => {
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
        is_completed,
        completed_at,
        raid_applications (
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
        )
      `)
      .eq("is_completed", false);

    if (error) {
      console.error("레이드 불러오기 실패:", error.message);
      setRaids([]);
      setLoading(false);
      return;
    }

    const titleOrder = {
      "심연의재련: 루드라": 0,
      "침식의 정화소": 1,
    };

    const mappedRaids = (data || []).map((raid) => {
      const applications = raid.raid_applications || [];
      const parties = buildRaidParties(applications);

      const needsSupport = parties.some((party) => !party.hasRequiredSupport);
      const powerGap = Math.abs(
        (parties[0]?.averagePower || 0) - (parties[1]?.averagePower || 0)
      );

      return {
        ...raid,
        current_members: applications.length,
        parties,
        needsSupport,
        powerGap,
        isUnbalanced: powerGap >= 3000,
      };
    });

    const sorted = mappedRaids.sort((a, b) => {
      const aOrder = titleOrder[a.title] ?? 99;
      const bOrder = titleOrder[b.title] ?? 99;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.start_time.localeCompare(b.start_time);
    });

    setRaids(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRaids();

    const channel = supabase
      .channel("raid-applications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "raid_applications",
        },
        () => {
          fetchRaids();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "raids",
        },
        () => {
          fetchRaids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRaids]);

  return {
    raids,
    loading,
    refetchRaids: fetchRaids,
  };
}

export default useRaids;