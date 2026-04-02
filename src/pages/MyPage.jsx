import { useMemo, useState } from "react";
import Layout from "../layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import useMyCharacters from "../hooks/useMyCharacters";
import MyPageHero from "../components/mypage/MyPageHero";
import MyCharacterForm from "../components/mypage/MyCharacterForm";
import MyCharacterCard from "../components/mypage/MyCharacterCard";
import "../styles/my-page.css";

function MyPage() {
  const { user, loading: authLoading } = useAuthContext();
  const {
    characters,
    loading: charactersLoading,
    addCharacter,
    deleteCharacter,
    refetchCharacters,
  } = useMyCharacters(user);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [power, setPower] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editPower, setEditPower] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [settingMainId, setSettingMainId] = useState(null);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort(
      (a, b) => Number(b.power || 0) - Number(a.power || 0)
    );
  }, [characters]);

  const mainCharacter = useMemo(() => {
    return (
      sortedCharacters.find((character) => character.is_main) ||
      sortedCharacters[0] ||
      null
    );
  }, [sortedCharacters]);

  const characterCount = sortedCharacters.length;

  const handleAddCharacter = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("캐릭터명을 입력해주세요.");
      return;
    }

    if (!job) {
      alert("직업을 선택해주세요.");
      return;
    }

    if (!power) {
      alert("전투력을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      await addCharacter({
        name: name.trim(),
        job,
        power: Number(power),
      });

      setName("");
      setJob("");
      setPower("");
      setShowAddForm(false);

      alert("캐릭터가 추가되었습니다.");
    } catch (error) {
      alert(error.message || "캐릭터 추가 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCharacter = async (character) => {
    const confirmed = window.confirm(
      `${character.name} 캐릭터를 삭제할까요?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(character.id);
      await deleteCharacter(character.id);
      alert("캐릭터가 삭제되었습니다.");
    } catch (error) {
      alert(error.message || "캐릭터 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (character) => {
    setEditingId(character.id);
    setEditName(character.name || "");
    setEditJob(character.job || "");
    setEditPower(character.power || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditJob("");
    setEditPower("");
  };

  const handleUpdateCharacter = async (characterId) => {
    if (!editName.trim()) {
      alert("캐릭터명을 입력해주세요.");
      return;
    }

    if (!editJob) {
      alert("직업을 선택해주세요.");
      return;
    }

    if (!editPower) {
      alert("전투력을 입력해주세요.");
      return;
    }

    try {
      setUpdatingId(characterId);

      const { error } = await supabase
        .from("characters")
        .update({
          name: editName.trim(),
          job: editJob,
          power: Number(editPower),
        })
        .eq("id", characterId);

      if (error) {
        throw error;
      }

      await refetchCharacters?.();
      cancelEdit();
      alert("캐릭터 정보가 수정되었습니다.");
    } catch (error) {
      alert(error.message || "캐릭터 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetMainCharacter = async (character) => {
    const confirmed = window.confirm(
      `${character.name} 캐릭터를 대표 캐릭터로 지정할까요?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSettingMainId(character.id);

      const { error: resetError } = await supabase
        .from("characters")
        .update({ is_main: false })
        .eq("user_id", user.id);

      if (resetError) {
        throw resetError;
      }

      const { error: setMainError } = await supabase
        .from("characters")
        .update({ is_main: true })
        .eq("id", character.id);

      if (setMainError) {
        throw setMainError;
      }

      await refetchCharacters?.();
      alert("대표 캐릭터가 변경되었습니다.");
    } catch (error) {
      alert(error.message || "대표 캐릭터 지정 중 오류가 발생했습니다.");
    } finally {
      setSettingMainId(null);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="my-page">
          <div className="my-page-loading">로딩 중.</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="my-page">
          <div className="my-page-locked-card">
            <h1 className="my-page-locked-title">마이페이지</h1>
            <p className="my-page-locked-text">로그인이 필요합니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="my-page">
        <MyPageHero
          user={user}
          mainCharacter={mainCharacter}
          characterCount={characterCount}
        />

        {charactersLoading && (
          <div className="my-page-loading">정보 불러오는 중.</div>
        )}

        <section className="my-section">
          <div className="my-section-header">
            <div className="my-section-header-left">
              <div className="my-section-overline">CHARACTER LOADOUT</div>
              <p className="my-section-subtitle">
                공격대 신청에 사용할 캐릭터를 관리할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              className="my-primary-button"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {showAddForm ? "추가 닫기" : "캐릭터 추가"}
            </button>
          </div>

          {showAddForm && (
            <MyCharacterForm
              mode="add"
              name={name}
              setName={setName}
              job={job}
              setJob={setJob}
              power={power}
              setPower={setPower}
              onSubmit={handleAddCharacter}
              loading={saving}
            />
          )}

          {sortedCharacters.length === 0 ? (
            <div className="my-empty-card">
              <div className="my-empty-title">등록된 캐릭터가 없습니다.</div>
              <div className="my-empty-sub">
                캐릭터를 추가하면 공격대 신청에 사용할 수 있습니다.
              </div>
            </div>
          ) : (
            <div className="my-character-grid">
              {sortedCharacters.map((character) => (
                <MyCharacterCard
                  key={character.id}
                  character={character}
                  isEditing={editingId === character.id}
                  editName={editName}
                  setEditName={setEditName}
                  editJob={editJob}
                  setEditJob={setEditJob}
                  editPower={editPower}
                  setEditPower={setEditPower}
                  onSave={handleUpdateCharacter}
                  onCancelEdit={cancelEdit}
                  onStartEdit={startEdit}
                  onDelete={handleDeleteCharacter}
                  onSetMain={handleSetMainCharacter}
                  updatingId={updatingId}
                  deletingId={deletingId}
                  settingMainId={settingMainId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default MyPage;