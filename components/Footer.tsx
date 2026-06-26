import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-700">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-heading text-lg font-semibold text-white">WillItFit</span>
            <p className="mt-2 max-w-xs font-body text-sm text-navy-200">
              Know before you go. Free cabin baggage size-checking for every major airline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-12">
            <div>
              <h3 className="font-body text-sm font-semibold text-white">Explore</h3>
              <ul className="mt-3 space-y-2 font-body text-sm text-navy-200">
                <li><Link href="/airlines" className="hover:text-green-400">Airlines</Link></li>
                <li><Link href="/tips" className="hover:text-green-400">Travel tips</Link></li>
                <li><Link href="/#checker" className="hover:text-green-400">Bag checker</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-white">About</h3>
              <ul className="mt-3 space-y-2 font-body text-sm text-navy-200">
                <li><Link href="/about" className="hover:text-green-400">Our data</Link></li>
                <li><Link href="/contact" className="hover:text-green-400">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-navy-600 pt-6 font-body text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WillItFit. Allowances change — always confirm with your airline before flying.</p>
          <p>Built for travellers, not algorithms.</p>
        </div>
      </div>
    </footer>
  );
}
