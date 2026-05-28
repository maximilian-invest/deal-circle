import type { Album, AlbumTone } from "./types";

const GRADIENTS: Record<AlbumTone, string> = {
  violet:  "radial-gradient(120% 80% at 20% 30%, rgba(110,43,255,0.6), transparent 60%), radial-gradient(80% 60% at 80% 70%, rgba(255,111,216,0.5), transparent 60%), #1F1F22",
  magenta: "radial-gradient(120% 80% at 30% 20%, rgba(255,45,135,0.55), transparent 60%), radial-gradient(80% 60% at 70% 80%, rgba(255,168,199,0.45), transparent 60%), #1F1F22",
  orange:  "radial-gradient(120% 80% at 30% 30%, rgba(255,106,44,0.6), transparent 60%), radial-gradient(80% 60% at 80% 70%, rgba(255,192,122,0.5), transparent 60%), #1F1F22",
  coral:   "radial-gradient(120% 80% at 20% 30%, rgba(255,126,126,0.6), transparent 60%), radial-gradient(80% 60% at 80% 70%, rgba(255,197,200,0.5), transparent 60%), #1F1F22",
  dusk:    "radial-gradient(110% 80% at 30% 30%, rgba(110,43,255,0.45), transparent 60%), radial-gradient(80% 60% at 80% 70%, rgba(255,45,135,0.35), transparent 60%), #1F1F22",
};

export default function Gallery({ albums }: { albums: Album[] }) {
  return (
    <div className="mb-gallery">
      {albums.map((a, i) => (
        <a key={i} className="mb-gallery-tile" href="#" onClick={(e) => e.preventDefault()}>
          <div className="mb-gallery-bg" style={{ background: GRADIENTS[a.tone] }} />
          <div className="mb-gallery-overlay" />
          <span className="mb-gallery-count">{a.count} Fotos</span>
          <div className="mb-gallery-label">
            <span className="mb-gallery-title">{a.title}</span>
            <span className="mb-gallery-meta">{a.meta}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
