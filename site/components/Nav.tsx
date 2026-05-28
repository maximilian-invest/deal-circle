"use client";
import { motion } from "framer-motion";

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
          <svg width="26" height="26" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fff" strokeWidth="2.4" />
            <circle cx="20" cy="20" r="4.2" fill="#fff" />
          </svg>
          <span className="dc-nav-wordmark">DealCircle</span>
          <span className="dc-nav-tag">Salzburg</span>
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
          <a href="#kontakt" className="dc-btn dc-btn-primary">Mitglied werden</a>
        </div>
      </div>
    </motion.header>
  );
}
