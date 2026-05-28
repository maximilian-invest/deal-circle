import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Konzept from "@/components/Konzept";
import Format from "@/components/Format";
import Rhythmus from "@/components/Rhythmus";
import Eindruecke from "@/components/Eindruecke";
import Mitglieder from "@/components/Mitglieder";
import Team from "@/components/Team";
import Werte from "@/components/Werte";
import FAQ from "@/components/FAQ";
import Kontakt from "@/components/Kontakt";
import Footer from "@/components/Footer";
import RevealManager from "@/components/RevealManager";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Konzept />
        <Format />
        <Rhythmus />
        <Eindruecke />
        <Mitglieder />
        <Team />
        <Werte />
        <FAQ />
        <Kontakt />
      </main>
      <Footer />
      <RevealManager />
    </>
  );
}
