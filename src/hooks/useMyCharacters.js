import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function useMyCharacters(user) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .order("is_main", { ascending: false });

    if (error) {
      console.error("캐릭터 불러오기 실패:", error);
      setCharacters([]);
    } else {
      setCharacters(data || []);
    }

    setLoading(false);
  }, [user]);

  const addCharacter = async ({ name, job, power }) => {
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("캐릭터명을 입력해주세요.");
    }

    if (!job) {
      throw new Error("직업을 선택해주세요.");
    }

    if (!power || Number(power) <= 0) {
      throw new Error("전투력을 올바르게 입력해주세요.");
    }

    const isFirstCharacter = characters.length === 0;

    const { error } = await supabase.from("characters").insert([
      {
        user_id: user.id,
        name: trimmedName,
        job,
        power: Number(power),
        is_main: isFirstCharacter,
      },
    ]);

    if (error) {
      console.error("캐릭터 추가 실패:", error);
      throw error;
    }

    await fetchCharacters();
  };

  const deleteCharacter = async (characterId) => {
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterId)
      .eq("user_id", user.id);

    if (error) {
      console.error("캐릭터 삭제 실패:", error);
      throw error;
    }

    await fetchCharacters();
  };

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return {
    characters,
    loading,
    fetchCharacters,
    refetchCharacters: fetchCharacters,
    addCharacter,
    deleteCharacter,
  };
}

export default useMyCharacters;