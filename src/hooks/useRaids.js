import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { buildRaidParties } from "../utils/buildRaidParties";

function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function useRaids() {
  const [raids, setRaids] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRaids = useCallback(async () => {
    setLoading(true);

    // 7일 전부터 미래까지 조회 (시작 시간 기준 4시간 경과 여부는 클라이언트에서 판단)
    const sevenDaysAgo = getLocalDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

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
        created_by,
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
      .gte("raid_date", sevenDaysAgo);

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

    // 방장 대표 캐릭터 조회
    const hostIds = [...new Set(mappedRaids.map((r) => r.created_by).filter(Boolean))];
    let hostCharacterMap = {};
    if (hostIds.length > 0) {
      const { data: hostChars } = await supabase
        .from("characters")
        .select("user_id, name, job")
        .in("user_id", hostIds)
        .eq("is_main", true);
      for (const c of hostChars || []) {
        hostCharacterMap[c.user_id] = { name: c.name, job: c.job };
      }
    }

    const withHost = sorted.map((raid) => ({
      ...raid,
      hostCharacter: hostCharacterMap[raid.created_by] || null,
    }));

    setRaids(withHost);
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