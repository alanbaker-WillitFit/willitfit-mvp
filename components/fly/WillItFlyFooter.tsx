import Link from "next/link";
import styles from "./WillItFlyExperience.module.css";

export default function WillItFlyFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <p className={styles.footerTagline}>Know Before You <span>Go.</span></p>
        <nav className={styles.footerNav} aria-label="About, legal and contact">
          <Link href="/fly/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/legal">Terms &amp; Legal</Link>
          <Link href="/contact">Contact</Link>
          <a href="https://will-it-fit.net">WillItFit</a>
        </nav>
        <p className={styles.footerNotice}>
          © {new Date().getFullYear()} WillItFly. Travel information can change — always confirm with official sources.
        </p>
      </div>
    </footer>
  );
}
