import type { StatItem } from "./types";

export default function Stats({ items }: { items: StatItem[] }) {
  return (
    <div className="mb-stats">
      {items.map((s, i) => (
        <div key={i} className="mb-stat">
          <span className="mb-stat-label">{s.label}</span>
          <span className="mb-stat-value">{s.value}</span>
          <span className="mb-stat-note">{s.note}</span>
        </div>
      ))}
    </div>
  );
}
