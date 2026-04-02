import { useMemo } from "react";
import RaidCard from "./RaidCard";

function groupByTitle(raids) {
  const map = new Map();
  for (const r of raids) {
    if (!map.has(r.title)) map.set(r.title, []);
    map.get(r.title).push(r);
  }
  return map;
}

function RaidGrid({ raids, titleOrder, selectedRaidId, onSelectRaid }) {
  const grouped = useMemo(() => groupByTitle(raids || []), [raids]);

  return (
    <div className="raidBoard">
      {titleOrder.map((title) => {
        const list = grouped.get(title) || [];

        return (
          <section className="raidSection" key={title}>
            <div className="raidSectionHeader">
              <span className="raidSectionBadge">{title}</span>
            </div>

            {list.length === 0 ? (
              <p className="raidSectionEmpty">등록된 시간표가 없습니다.</p>
            ) : (
              <ul className="raidGrid" aria-label={`${title} 시간표`}>
                {list.map((raid) => (
                  <li key={raid.id} className="raidGridItem">
                    <RaidCard
                      raid={raid}
                      selected={selectedRaidId === raid.id}
                      onClick={onSelectRaid}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default RaidGrid;
