type Person = { n: string; role: string; bio: string; photo: string | null };

export default function Team() {
  const people: Person[] = [
    {
      n: "Pascal Grebien",
      role: "Initiator & Gastgeber",
      bio: "Bringt den Kreis zusammen und kuratiert Gäste sowie Themen für jedes Treffen.",
      photo: "/team/pascal.png",
    },
    {
      n: "Maximilian Hölzl",
      role: "Marketing, Organisation & Administration",
      bio: "Verantwortet die Außenkommunikation, koordiniert Vortragende und sorgt dafür, dass jedes Treffen vorbereitet ist.",
      photo: "/team/maximilian.png",
    },
    {
      n: "Stephanie Strobl",
      role: "Administration & Verwaltung",
      bio: "Hält den Kreis im Hintergrund zusammen — Termine, Location, Mitgliederbetreuung. Erste Ansprechperson für organisatorische Fragen.",
      photo: "/team/stephanie.jpg",
    },
  ];

  return (
    <section className="dc-section" id="team">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Hinter dem Kreis</div>
        <h2 className="dc-section-title">Drei, die einladen.</h2>
        <p className="dc-body-lg dc-ink-muted" style={{ maxWidth: "560px", margin: "8px 0 0" }}>
          DealCircle Salzburg wird von einem kleinen Kreis getragen, der die
          Runde zusammenhält — und im Hintergrund dafür sorgt, dass jedes
          Treffen den Charakter behält, der ihn auszeichnet.
        </p>
      </div>

      <div className="dc-team-pyramid">
        <div className="dc-team-row dc-team-row--top">
          <TeamCard person={people[0]} featured />
        </div>
        <div className="dc-team-row dc-team-row--bottom">
          <TeamCard person={people[1]} delay="1" />
          <TeamCard person={people[2]} delay="2" />
        </div>
      </div>
    </section>
  );
}

function TeamCard({ person, featured, delay }: { person: Person; featured?: boolean; delay?: string }) {
  const initials = person.n.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <article
      className={"dc-team-card dc-reveal" + (featured ? " dc-team-card--featured" : "")}
      data-delay={delay || ""}
    >
      <div className="dc-team-avatar" aria-hidden="true">
        {person.photo ? (
          <img src={person.photo} alt="" loading="lazy" />
        ) : (
          <>
            <span>{initials}</span>
            <span className="dc-team-avatar-note">Foto folgt</span>
          </>
        )}
      </div>
      <div className="dc-team-meta">
        <h3 className="dc-team-name">{person.n}</h3>
        <span className="dc-team-role">{person.role}</span>
      </div>
      <p className="dc-team-bio">{person.bio}</p>
    </article>
  );
}
