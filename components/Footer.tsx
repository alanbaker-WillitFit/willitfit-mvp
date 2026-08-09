import Link from "next/link";
import { getRuntimeContent } from "@/services/runtimeContent";

function safeExternalUrl(value: string): string | null {
  const url = value.trim();
  return /^https:\/\//i.test(url) ? url : null;
}

export default async function Footer() {
  const { content: socialLinks } = await getRuntimeContent({
    module: "footer",
    page: "footer",
    section: "social",
  });

  return (
    <footer className="wf-compact-footer">
      <div className="wf-container">
        <p className="wf-footer-tagline">Know Before You <span>Go.</span></p>
        <div className="wf-footer-links">
          <nav aria-label="Legal and contact">
            <Link href="/privacy">Privacy</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/legal">Terms &amp; Legal</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          {socialLinks.length > 0 && (
            <nav className="wf-footer-social" aria-label="Social media">
              <span>Follow us on</span>
              {socialLinks.map((item) => {
                const label = item.linkLabel || item.title;
                const href = safeExternalUrl(item.linkUrl);
                return href ? (
                  <a key={item.contentId} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                ) : (
                  <span key={item.contentId} aria-disabled="true">{label}</span>
                );
              })}
            </nav>
          )}
        </div>
        <p>© {new Date().getFullYear()} WillitFit. Allowances change — always confirm with your airline.</p>
      </div>
    </footer>
  );
}
