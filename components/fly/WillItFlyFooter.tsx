import Link from "next/link";
import styles from "./WillItFlyExperience.module.css";

const linkStyle = { color: "#fff", textDecoration: "none" } as const;

export default function WillItFlyFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
          Know Before You <span style={{ color: "#22c55e" }}>Go.</span>
        </p>
        <nav
          aria-label="About, legal and contact"
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 16px" }}
        >
          <Link href="/fly/about" style={linkStyle}>About</Link>
          <Link href="/privacy" style={linkStyle}>Privacy</Link>
          <Link href="/accessibility" style={linkStyle}>Accessibility</Link>
          <Link href="/legal" style={linkStyle}>Terms &amp; Legal</Link>
          <Link href="/contact" style={linkStyle}>Contact</Link>
          <a href="https://will-it-fit.net" style={linkStyle}>WillItFit</a>
        </nav>
        <p style={{ margin: 0, maxWidth: 390, textAlign: "right" }}>
          © {new Date().getFullYear()} WillItFly. Travel information can change — always confirm with official sources.
        </p>
      </div>
    </footer>
  );
}
