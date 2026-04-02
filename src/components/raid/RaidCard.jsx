function RaidCard({ raid, selected, onClick }) {
  const label = `${raid.title} ${raid.start_time_label} (${raid.member_count}/${raid.max_members})${
    raid.is_full ? " 마감" : ""
  }`;

  return (
    <button
      type="button"
      className="raidCard"
      data-state={raid.is_full ? "full" : selected ? "selected" : "available"}
      aria-pressed={selected}
      aria-label={label}
      onClick={() => onClick(raid)}
    >
      <span className="raidCardTime">{raid.start_time_label}</span>
      <span className="raidCardCount">
        ({raid.member_count}/{raid.max_members})
      </span>
    </button>
  );
}

export default RaidCard;
