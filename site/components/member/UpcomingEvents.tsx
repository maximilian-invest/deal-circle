import type { EventStatus, UpcomingEvent } from "./types";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function Chip({ status }: { status: EventStatus }) {
  if (status === "paid")     return <span className="mb-event-chip mb-event-chip--paid">Angemeldet & bezahlt</span>;
  if (status === "limited")  return <span className="mb-event-chip mb-event-chip--limited">Wenige Plätze</span>;
  if (status === "waitlist") return <span className="mb-event-chip mb-event-chip--waitlist">Warteliste</span>;
  return <span className="mb-event-chip mb-event-chip--open">Anmeldung offen</span>;
}

type Props = {
  events: UpcomingEvent[];
  onSignup: (e: UpcomingEvent) => void;
};

export default function UpcomingEvents({ events, onSignup }: Props) {
  return (
    <div className="mb-events">
      {events.map((e) => (
        <article key={e.id} className="mb-event">
          <div className="mb-event-date">
            <span className="mb-event-date-day">{e.day}</span>
            <span className="mb-event-date-month">{e.month}</span>
          </div>
          <div className="mb-event-info">
            <h3 className="mb-event-title">{e.title}</h3>
            <div className="mb-event-meta">
              <span className="mb-event-meta-item">
                <Icon d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />{e.time}
              </span>
              <span className="mb-event-meta-item">
                <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />{e.location}
              </span>
            </div>
          </div>
          <div className="mb-event-status">
            <Chip status={e.status} />
            <a className="dc-btn dc-btn-secondary mb-event-cta" href={`/event/?id=${e.eventId}#programm`}>Programm ansehen</a>
            {e.status === "paid" ? null
              : e.status === "waitlist" ? (
                <button type="button" className="dc-btn dc-btn-secondary mb-event-cta" onClick={() => onSignup(e)}>Auf Warteliste</button>
              ) : (
                <button type="button" className="dc-btn dc-btn-primary mb-event-cta" onClick={() => onSignup(e)}>Anmelden</button>
              )}
          </div>
        </article>
      ))}
    </div>
  );
}
