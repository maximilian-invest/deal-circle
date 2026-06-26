import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Impressum · DealCircle Salzburg",
  description: "Impressum und rechtliche Angaben der PRO ASSETS GmbH (DealCircle Salzburg).",
};

export default function ImpressumPage() {
  return (
    <>
      <Nav />
      <main className="dc-legal">
        <article className="dc-legal-inner">
          <header className="dc-legal-head">
            <div className="dc-eyebrow">Rechtliches</div>
            <h1 className="dc-legal-h1">Impressum</h1>
            <p className="dc-legal-lede">
              Offenlegung und Angaben gemäß § 5 E-Commerce-Gesetz (ECG), § 14
              Unternehmensgesetzbuch (UGB), § 63 Gewerbeordnung (GewO) sowie
              § 25 Mediengesetz (MedienG).
            </p>
          </header>

          <section>
            <h2>Medieninhaber, Eigentümer und für den Inhalt verantwortlich</h2>
            <p>
              <strong>PRO ASSETS GmbH</strong><br />
              Auer-von-Welsbach-Straße 18/7<br />
              5020 Salzburg<br />
              Österreich
            </p>
            <p>
              E-Mail: <a href="mailto:event@deal-circle.at">event@deal-circle.at</a><br />
              Web: <a href="https://www.deal-circle.at">www.deal-circle.at</a>
            </p>
            <p>
              „Deal-Circle" ist eine Marke bzw. ein Geschäftszweig der PRO ASSETS GmbH.
            </p>
          </section>

          <section>
            <h2>Unternehmensdaten</h2>
            <ul>
              <li><strong>Rechtsform:</strong> Gesellschaft mit beschränkter Haftung (GmbH)</li>
              <li><strong>Firmenbuchnummer:</strong> FN 659245 d</li>
              <li><strong>Firmenbuchgericht:</strong> Landesgericht Salzburg</li>
              <li><strong>UID-Nummer:</strong> ATU82566901</li>
              <li><strong>Unternehmensgegenstand:</strong> Organisation und Durchführung von Veranstaltungen und Netzwerk-Events sowie Holding-/Beteiligungsverwaltung</li>
              <li><strong>Sitz:</strong> 5020 Salzburg</li>
            </ul>
          </section>

          <section>
            <h2>Vertretungsbefugter Geschäftsführer</h2>
            <p>Pascal Grebien (alleinvertretungsberechtigt)</p>
          </section>

          <section>
            <h2>Verantwortlich für den Inhalt der Website</h2>
            <p>PRO ASSETS GmbH (Anschrift wie oben)</p>
          </section>

          <section>
            <h2>Urheber, Konzeption und technische Umsetzung der Website</h2>
            <p><strong>Maximilian Hölzl</strong></p>
            <p>
              Konzeption, Gestaltung, Programmierung sowie die technische Umsetzung
              und das dieser Website zugrunde liegende System (Quellcode, Datenbank-
              und Serverarchitektur, E-Mail-Infrastruktur und sonstige technische
              Einrichtungen) wurden von Maximilian Hölzl erstellt und mit dessen
              eigenen Ressourcen errichtet und betrieben.
            </p>
            <p>
              Sämtliche Urheber- und Leistungsschutzrechte an diesen Werken und
              Leistungen verbleiben — soweit gesetzlich zulässig — bei Maximilian
              Hölzl. Es wurden keine ausschließlichen Werknutzungsrechte übertragen.
              Eine etwaige Nutzung durch den Medieninhaber erfolgt im Rahmen einer
              einfachen, widerruflichen Nutzungsbewilligung. Jede darüber hinausgehende
              Verwendung, Vervielfältigung, Bearbeitung oder Verbreitung der genannten
              Werke — auch auszugsweise — bedarf der vorherigen schriftlichen
              Zustimmung von Maximilian Hölzl.
            </p>
          </section>

          <section>
            <h2>Kammerzugehörigkeit und anwendbare Rechtsvorschriften</h2>
            <ul>
              <li><strong>Mitgliedschaft:</strong> Wirtschaftskammer Salzburg</li>
              <li>
                <strong>Anwendbare Rechtsvorschriften:</strong> Gewerbeordnung (GewO),
                abrufbar unter{" "}
                <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">www.ris.bka.gv.at</a>
              </li>
              <li><strong>Gewerbebehörde:</strong> Magistrat der Stadt Salzburg</li>
            </ul>
          </section>

          <section>
            <h2>Online-Streitbeilegung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>. Unsere E-Mail-Adresse findest du oben in diesem Impressum.
            </p>
            <p>
              Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2>Haftung für Inhalte</h2>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird
              jedoch keine Gewähr übernommen. Als Diensteanbieter sind wir gemäß
              § 18 ECG für eigene Inhalte auf diesen Seiten nach den allgemeinen
              Gesetzen verantwortlich, jedoch nicht verpflichtet, übermittelte oder
              gespeicherte fremde Informationen zu überwachen.
            </p>
          </section>

          <section>
            <h2>Haftung für Links</h2>
            <p>
              Unsere Website enthält gegebenenfalls Links zu externen Websites
              Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden
              Inhalte wird keine Haftung übernommen. Für die Inhalte der verlinkten
              Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.
            </p>
          </section>

          <section>
            <h2>Urheberrecht</h2>
            <p>
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen
              Seiten unterliegen dem österreichischen Urheberrecht. Beiträge Dritter
              sind als solche gekennzeichnet. Downloads und Kopien dieser Seite sind
              nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
          </section>

          <footer className="dc-legal-stand">Stand: Juni 2026</footer>
        </article>
      </main>
      <Footer />
    </>
  );
}
