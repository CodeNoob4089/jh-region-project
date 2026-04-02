import { JOB_OPTIONS } from "../../utils/myPageHelpers";

function MyCharacterForm({
  mode = "add",
  name,
  setName,
  job,
  setJob,
  power,
  setPower,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const isEditMode = mode === "edit";

  return (
    <form
      className={isEditMode ? undefined : "my-add-form-card"}
      onSubmit={onSubmit}
    >
      <div className={isEditMode ? "my-edit-grid" : "my-form-grid"}>
        <div className="my-form-group">
          <label className="my-form-label">캐릭터명</label>
          <input
            type="text"
            className="my-form-input"
            placeholder="캐릭터명"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="my-form-group">
          <label className="my-form-label">직업</label>
          <select
            className="my-form-input"
            value={job}
            onChange={(e) => setJob(e.target.value)}
          >
            <option value="">직업 선택</option>
            {JOB_OPTIONS.map((jobOption) => (
              <option key={jobOption} value={jobOption}>
                {jobOption}
              </option>
            ))}
          </select>
        </div>

        <div className="my-form-group">
          <label className="my-form-label">전투력</label>
          <input
            type="number"
            className="my-form-input"
            placeholder="전투력"
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />
        </div>
      </div>

      <div className="my-card-actions">
        <button type="submit" className="my-primary-button" disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </button>

        {isEditMode && (
          <button
            type="button"
            className="my-secondary-button"
            onClick={onCancel}
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

export default MyCharacterForm;