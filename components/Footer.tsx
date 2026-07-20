import Link from "next/link";

export default function Footer() {
  return (
    <footer className="wf-compact-footer">
      <div className="wf-container">
        <p className="wf-footer-tagline">Know Before You <span>Go.</span></p>
        <nav aria-label="Legal and contact"><Link href="/privacy">Privacy</Link><Link href="/accessibility">Accessibility</Link><Link href="/legal">Terms &amp; Legal</Link><Link href="/contact">Contact</Link></nav>
        <p>© {new Date().getFullYear()} WillitFit. Allowances change — always confirm with your airline.</p>
      </div>
    </footer>
  );
}
