import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function useMyProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("프로필 조회 에러:", error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setLoading(false);
    setInitialized(true);
  }, [user?.id]);

  useEffect(() => {
    setInitialized(false);
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    initialized,
    refetchProfile: fetchProfile,
  };
}

export default useMyProfile;