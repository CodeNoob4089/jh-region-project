import MyCharacterForm from "./MyCharacterForm";
import {
  JOB_STYLE_MAP,
  formatPowerK,
  getPowerTierClass,
} from "../../utils/myPageHelpers";

function MyCharacterCard({
  character,
  isEditing,
  editName,
  setEditName,
  editJob,
  setEditJob,
  editPower,
  setEditPower,
  onSave,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onSetMain,
  updatingId,
  deletingId,
  settingMainId,
}) {
  const isMain = !!character.is_main;

  return (
    <article className={`my-character-card ${isMain ? "is-main" : ""}`}>
      {isEditing ? (
        <MyCharacterForm
          mode="edit"
          name={editName}
          setName={setEditName}
          job={editJob}
          setJob={setEditJob}
          power={editPower}
          setPower={setEditPower}
          onSubmit={(e) => {
            e.preventDefault();
            onSave(character.id);
          }}
          onCancel={onCancelEdit}
          loading={updatingId === character.id}
        />
      ) : (
        <>
          <div className="my-character-card-top">
            <div className="my-character-identity">
              <div className="my-character-name-row">
                <div className="my-character-name">{character.name}</div>

                {isMain && <span className="my-character-badge">대표</span>}
              </div>

              <div
                className={`my-character-job my-job-pill ${
                  JOB_STYLE_MAP[character.job] || ""
                }`}
              >
                {character.job}
              </div>
            </div>

            <div className="my-character-power-box">
              <div className="my-character-power-label">전투력</div>
              <div
                className={`my-character-power ${getPowerTierClass(
                  character.power
                )}`}
              >
                {formatPowerK(character.power)}
              </div>
            </div>
          </div>

          <div className="my-card-actions">
            {!isMain && (
              <button
                type="button"
                className="my-accent-button"
                onClick={() => onSetMain(character)}
                disabled={settingMainId === character.id}
              >
                {settingMainId === character.id ? "변경 중..." : "대표 지정"}
              </button>
            )}

            <button
              type="button"
              className="my-secondary-button"
              onClick={() => onStartEdit(character)}
            >
              수정
            </button>

            <button
              type="button"
              className="my-danger-button"
              onClick={() => onDelete(character)}
              disabled={deletingId === character.id}
            >
              {deletingId === character.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

export default MyCharacterCard;