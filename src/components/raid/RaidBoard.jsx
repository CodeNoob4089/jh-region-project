import { useMemo, useState } from "react";
import useRaids, { RAID_TITLE_ORDER } from "../../hooks/useRaids";
import useRaidApplications from "../../hooks/useRaidApplications";
import RaidGrid from "./RaidGrid";
import RaidModal from "./RaidModal";

function RaidBoard({ user, characters, raidDate }) {
  const { raids, loading, error, refetchRaids, updateRaidMemberCount } = useRaids({
    raidDate,
    titleOrder: RAID_TITLE_ORDER,
  });

  const { applyToRaid, submitting } = useRaidApplications(user);

  const [selectedRaidId, setSelectedRaidId] = useState(null);
  const [modalError, setModalError] = useState("");

  const selectedRaid = useMemo(
    () => raids.find((r) => r.id === selectedRaidId) || null,
    [raids, selectedRaidId]
  );

  const openModalForRaid = (raid) => {
    setModalError("");
    setSelectedRaidId(raid.id);
  };

  const closeModal = () => {
    setSelectedRaidId(null);
    setModalError("");
  };

  const handleApply = async ({ raidId, characterId }) => {
    setModalError("");

    // optimistic: 먼저 카운트 +1
    updateRaidMemberCount(raidId, +1);

    try {
      await applyToRaid({ raidId, characterId });
      // 성공 시 모달 닫기 (또는 "완료" 표시)
      closeModal();

      // 운영 안정성을 위해, 백그라운드 refetch(선택)
      // await refetchRaids();
    } catch (e) {
      // 실패 시 롤백
      updateRaidMemberCount(raidId, -1);
      setModalError(e?.message || "신청 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <p>레이드 로딩 중...</p>;
  if (error)
    return (
      <div>
        <p>레이드 로딩 실패: {error.message || String(error)}</p>
        <button type="button" onClick={refetchRaids}>
          다시 시도
        </button>
      </div>
    );

  return (
    <div>
      <RaidGrid
        raids={raids}
        titleOrder={RAID_TITLE_ORDER}
        selectedRaidId={selectedRaidId}
        onSelectRaid={openModalForRaid}
      />

      <RaidModal
        open={!!selectedRaid}
        raid={selectedRaid}
        onClose={closeModal}
        user={user}
        characters={characters}
        onApply={handleApply}
        applying={submitting}
        errorMessage={modalError}
      />
    </div>
  );
}

export default RaidBoard;
