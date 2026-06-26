"use client";
import { motion } from "framer-motion";
import AuthBadge from "./AuthBadge";
import SessionCta from "./SessionCta";

export default function Nav() {
  return (
    <motion.header
      className="dc-nav"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="dc-nav-inner">
        <a href="#top" className="dc-nav-brand" aria-label="DealCircle Salzburg">
          <img
            src="/assets/logo-dc-white.svg"
            alt=""
            width={36}
            height={29}
            className="dc-nav-logo"
            aria-hidden="true"
          />
          <span className="dc-nav-wordmark">DealCircle</span>
        </a>
        <nav className="dc-nav-links" aria-label="Hauptnavigation">
          <a href="#konzept">Konzept</a>
          <a href="#format">Format</a>
          <a href="#rhythmus">Rhythmus</a>
          <a href="#mitglieder">Mitglieder</a>
          <a href="#team">Team</a>
          <a href="#werte">Werte</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="dc-nav-cta">
          <AuthBadge variant="dark" />
          <SessionCta joinHref="/mitglied-werden/" joinLabel="Mitglied werden" className="dc-btn dc-btn-primary" />
        </div>
      </div>
    </motion.header>
  );
}
