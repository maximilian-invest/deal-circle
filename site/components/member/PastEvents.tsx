import type { PastEventItem } from "./types";

export default function PastEvents({ events }: { events: PastEventItem[] }) {
  return (
    <div className="mb-past">
      {events.map((e, i) => (
        <div key={i} className="mb-past-row">
          <span className="mb-past-date">{e.date}</span>
          <span className="mb-past-title">{e.title}</span>
          <span className="mb-past-speaker">{e.speaker}</span>
          <span className="mb-past-count">{e.photos} Fotos · {e.attendees} dabei</span>
          <span className="mb-past-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}
