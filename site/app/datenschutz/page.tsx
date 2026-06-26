import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Datenschutzerklärung · DealCircle Salzburg",
  description: "Datenschutzerklärung der PRO ASSETS GmbH (DealCircle Salzburg) gemäß DSGVO.",
};

export default function DatenschutzPage() {
  return (
    <>
      <Nav />
      <main className="dc-legal">
        <article className="dc-legal-inner">
          <header className="dc-legal-head">
            <div className="dc-eyebrow">Rechtliches</div>
            <h1 className="dc-legal-h1">Datenschutzerklärung</h1>
            <p className="dc-legal-lede">
              Der Schutz deiner personenbezogenen Daten ist uns ein wichtiges
              Anliegen. Wir verarbeiten deine Daten ausschließlich auf Grundlage
              der gesetzlichen Bestimmungen (Datenschutz-Grundverordnung — DSGVO,
              österreichisches Datenschutzgesetz — DSG, Telekommunikationsgesetz —
              TKG 2021). In dieser Datenschutzerklärung informieren wir dich über
              die wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer
              Website.
            </p>
          </header>

          <section>
            <h2>1. Verantwortlicher</h2>
            <p>Verantwortlicher im Sinne der DSGVO ist:</p>
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
              Firmenbuchnummer: FN 659245 d, Landesgericht Salzburg<br />
              UID-Nummer: ATU82566901
            </p>
            <p>
              Bei Fragen zum Datenschutz erreichst du uns jederzeit unter{" "}
              <a href="mailto:event@deal-circle.at">event@deal-circle.at</a>.
            </p>
            <p>
              Ein Datenschutzbeauftragter ist gesetzlich nicht zwingend zu
              bestellen und wurde nicht bestellt.
            </p>
          </section>

          <section>
            <h2>2. Allgemeines zur Datenverarbeitung</h2>
            <p>
              Wir verarbeiten personenbezogene Daten nur, soweit dies zur
              Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte
              und Leistungen erforderlich ist oder du eingewilligt hast.
              Personenbezogene Daten sind alle Informationen, die sich auf eine
              identifizierte oder identifizierbare natürliche Person beziehen
              (z.&nbsp;B. Name, Adresse, E-Mail-Adresse).
            </p>
          </section>

          <section>
            <h2>3. Rechtsgrundlagen der Verarbeitung</h2>
            <p>Wir verarbeiten deine Daten je nach Zweck auf folgenden Rechtsgrundlagen:</p>
            <ul>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung (z.&nbsp;B. Newsletter, optionale Angaben)</li>
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertrag bzw. vorvertragliche Maßnahmen (z.&nbsp;B. Anmeldung zu einer Veranstaltung, Bearbeitung deiner Anfrage)</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — rechtliche Verpflichtung (z.&nbsp;B. Aufbewahrungspflichten)</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — berechtigtes Interesse (z.&nbsp;B. technischer Betrieb und Sicherheit der Website)</li>
            </ul>
          </section>

          <section>
            <h2>4. Kontaktaufnahme / Kontaktformular</h2>
            <p>
              Wenn du über unser Kontaktformular oder per E-Mail mit uns Kontakt
              aufnimmst, werden die von dir übermittelten Daten (insbesondere
              Name, E-Mail-Adresse, Telefonnummer sowie der Inhalt deiner Nachricht)
              zum Zweck der Bearbeitung deiner Anfrage und für den Fall von
              Anschlussfragen bei uns gespeichert.
            </p>
            <ul>
              <li><strong>Zweck:</strong> Bearbeitung und Beantwortung deiner Anfrage</li>
              <li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich/vertraglich) bzw. lit. f DSGVO (berechtigtes Interesse an der Kommunikation)</li>
              <li><strong>Speicherdauer:</strong> Die Daten werden gelöscht, sobald sie für die Erreichung des Zwecks nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</li>
            </ul>
            <p>Diese Daten geben wir nicht ohne deine Einwilligung weiter.</p>
          </section>

          <section>
            <h2>5. Anmeldung zu Veranstaltungen / Events</h2>
            <p>
              Wenn du dich über unsere Website zu einer Veranstaltung anmeldest,
              verarbeiten wir die im Anmeldeformular angegebenen Daten (z.&nbsp;B.
              Vor- und Nachname, E-Mail-Adresse, Telefonnummer, Unternehmen/Funktion
              sowie ggf. weitere für die jeweilige Veranstaltung erforderliche Angaben).
            </p>
            <ul>
              <li><strong>Zweck:</strong> Organisation, Durchführung und Abwicklung der Veranstaltung, Verwaltung der Teilnehmerliste, Versand veranstaltungsbezogener Informationen (z.&nbsp;B. Bestätigung, Erinnerung, Änderungen)</li>
              <li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Durchführung der Anmeldung als vorvertragliche/vertragliche Maßnahme); für freiwillige Zusatzangaben ggf. Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
              <li><strong>Empfänger:</strong> Eine Weitergabe erfolgt nur, soweit dies für die Durchführung der Veranstaltung erforderlich ist (z.&nbsp;B. an Veranstaltungsorte, Catering oder eingesetzte Dienstleister) oder eine gesetzliche Verpflichtung besteht.</li>
              <li><strong>Speicherdauer:</strong> Wir speichern die Anmeldedaten für die Dauer der Veranstaltungsabwicklung sowie darüber hinaus zur Erfüllung gesetzlicher (insbesondere steuer- und unternehmensrechtlicher) Aufbewahrungspflichten von in der Regel bis zu sieben Jahren.</li>
            </ul>

            <h3>Foto- und Filmaufnahmen bei Veranstaltungen</h3>
            <p>
              Bei unseren Veranstaltungen können Foto- oder Videoaufnahmen zu
              Dokumentations- und Werbezwecken angefertigt werden. Soweit Personen
              erkennbar abgebildet werden, erfolgt dies auf Grundlage deiner
              Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) oder unseres berechtigten
              Interesses (Art. 6 Abs. 1 lit. f DSGVO). Du kannst einer Aufnahme
              jederzeit vor Ort gegenüber dem Fotografen/den Mitarbeitenden
              widersprechen.
            </p>
          </section>

          <section>
            <h2>6. Server-Logfiles</h2>
            <p>
              Beim Aufruf unserer Website werden durch den Browser automatisch
              Informationen an den Server unserer Website gesendet und temporär
              in sogenannten Logfiles gespeichert. Erfasst werden insbesondere:
            </p>
            <ul>
              <li>IP-Adresse des anfragenden Geräts</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
              <li>verwendeter Browser, Betriebssystem und ggf. Name des Access-Providers</li>
            </ul>
            <ul>
              <li><strong>Zweck:</strong> Gewährleistung eines reibungslosen Verbindungsaufbaus, einer komfortablen Nutzung, Auswertung der Systemsicherheit und -stabilität</li>
              <li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am technisch fehlerfreien und sicheren Betrieb)</li>
              <li><strong>Speicherdauer:</strong> Diese Daten werden nach kurzer Zeit automatisch gelöscht, sofern keine sicherheitsrelevanten Vorkommnisse eine längere Speicherung erfordern.</li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>
              Unsere Website verwendet gegebenenfalls Cookies. Das sind kleine
              Textdateien, die auf deinem Endgerät gespeichert werden. Technisch
              notwendige Cookies, die für den Betrieb der Website erforderlich
              sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gesetzt.
              Soweit nicht notwendige Cookies (z.&nbsp;B. für Statistik oder
              Marketing) eingesetzt werden, erfolgt dies nur mit deiner Einwilligung
              (Art. 6 Abs. 1 lit. a DSGVO), die du jederzeit widerrufen kannst.
            </p>
            <p>
              Du kannst deinen Browser so einstellen, dass du über das Setzen
              von Cookies informiert wirst, Cookies nur im Einzelfall erlaubst,
              die Annahme generell ausschließt oder gespeicherte Cookies löschst.
            </p>
          </section>

          <section>
            <h2>8. Datensicherheit</h2>
            <p>
              Wir treffen angemessene technische und organisatorische
              Sicherheitsmaßnahmen, um deine Daten gegen zufällige oder
              vorsätzliche Manipulation, Verlust, Zerstörung oder den Zugriff
              unberechtigter Personen zu schützen. Die Datenübertragung auf
              unserer Website erfolgt verschlüsselt (SSL/TLS).
            </p>
          </section>

          <section>
            <h2>9. Auftragsverarbeiter und Datenübermittlung</h2>
            <p>
              Zur Bereitstellung unserer Website und unserer Leistungen setzen
              wir teilweise externe Dienstleister ein (z.&nbsp;B. Webhosting,
              E-Mail-Dienste, Veranstaltungs- bzw. Anmeldesoftware). Diese
              verarbeiten Daten ausschließlich in unserem Auftrag und sind
              vertraglich gemäß Art. 28 DSGVO gebunden. Eine Übermittlung in
              Drittländer erfolgt nur, sofern die gesetzlichen Voraussetzungen
              (z.&nbsp;B. Angemessenheitsbeschluss oder geeignete Garantien nach
              Art. 44 ff. DSGVO) erfüllt sind.
            </p>
          </section>

          <section>
            <h2>10. Deine Rechte als betroffene Person</h2>
            <p>
              Dir stehen hinsichtlich der dich betreffenden personenbezogenen
              Daten grundsätzlich folgende Rechte zu:
            </p>
            <ul>
              <li><strong>Recht auf Auskunft</strong> (Art. 15 DSGVO)</li>
              <li><strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO)</li>
              <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO)</li>
              <li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
              <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
              <li><strong>Recht auf Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li><strong>Recht auf Widerruf</strong> einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
            </ul>
            <p>
              Zur Ausübung deiner Rechte genügt eine Nachricht an{" "}
              <a href="mailto:event@deal-circle.at">event@deal-circle.at</a>.
            </p>
          </section>

          <section>
            <h2>11. Beschwerderecht</h2>
            <p>
              Wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen
              das Datenschutzrecht verstößt oder deine datenschutzrechtlichen
              Ansprüche sonst in einer Weise verletzt worden sind, kannst du
              dich bei der Aufsichtsbehörde beschweren. In Österreich ist dies
              die Datenschutzbehörde:
            </p>
            <p>
              <strong>Österreichische Datenschutzbehörde</strong><br />
              Barichgasse 40–42, 1030 Wien<br />
              Telefon: +43 1 52 152-0<br />
              E-Mail: <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a><br />
              Web: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a>
            </p>
          </section>

          <section>
            <h2>12. Aktualität und Änderung dieser Datenschutzerklärung</h2>
            <p>
              Diese Datenschutzerklärung ist aktuell gültig und hat den Stand
              Juni 2026. Durch die Weiterentwicklung unserer Website oder
              aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann
              es notwendig werden, diese Datenschutzerklärung anzupassen.
            </p>
          </section>

          <footer className="dc-legal-stand">Stand: Juni 2026</footer>
        </article>
      </main>
      <Footer />
    </>
  );
}
